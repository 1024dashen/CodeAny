use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectFile {
    pub path: String,
    pub content: String,
}

pub(crate) struct PreviewServer {
    shutdown: Arc<AtomicBool>,
    handle: Option<JoinHandle<()>>,
}

pub struct PreviewServerState(pub Mutex<HashMap<u16, PreviewServer>>);

fn mime_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("html") | Some("htm") => "text/html; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("js") | Some("mjs") => "application/javascript; charset=utf-8",
        Some("json") => "application/json; charset=utf-8",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        Some("woff") => "font/woff",
        Some("woff2") => "font/woff2",
        Some("ttf") => "font/ttf",
        Some("webp") => "image/webp",
        _ => "application/octet-stream",
    }
}

fn find_entry_html(root: &Path) -> Option<PathBuf> {
    let index = root.join("index.html");
    if index.is_file() {
        return Some(index);
    }

    let entries = fs::read_dir(root).ok()?;
    let mut html_files: Vec<PathBuf> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            p.is_file()
                && p.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext.eq_ignore_ascii_case("html") || ext.eq_ignore_ascii_case("htm"))
                    .unwrap_or(false)
        })
        .collect();

    html_files.sort();
    html_files.into_iter().next()
}

fn resolve_file_path(root: &Path, url_path: &str) -> Option<PathBuf> {
    let trimmed = url_path.trim_start_matches('/');
    let candidate = if trimmed.is_empty() {
        find_entry_html(root)?
    } else {
        root.join(trimmed)
    };

    let canonical_root = root.canonicalize().ok()?;
    if candidate.is_file() {
        let canonical_file = candidate.canonicalize().ok()?;
        if canonical_file.starts_with(&canonical_root) {
            return Some(canonical_file);
        }
    }

    let index = if trimmed.is_empty() {
        find_entry_html(root)?
    } else {
        let nested = root.join(trimmed).join("index.html");
        if nested.is_file() {
            nested
        } else {
            return None;
        }
    };
    if index.is_file() {
        let canonical_index = index.canonicalize().ok()?;
        if canonical_index.starts_with(&canonical_root) {
            return Some(canonical_index);
        }
    }

    None
}

fn handle_connection(stream: &mut std::net::TcpStream, canonical_root: &Path) {
    let mut buffer = [0u8; 4096];
    let n = match stream.read(&mut buffer) {
        Ok(n) => n,
        Err(_) => return,
    };
    let request = String::from_utf8_lossy(&buffer[..n]);
    let request_line = request.lines().next().unwrap_or("");
    let url_path = request_line.split_whitespace().nth(1).unwrap_or("/");

    match resolve_file_path(canonical_root, url_path) {
        Some(file_path) => {
            let content = fs::read(&file_path).unwrap_or_default();
            let content_type = mime_type(&file_path);
            let headers = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                content_type,
                content.len()
            );
            let _ = stream.write_all(headers.as_bytes());
            let _ = stream.write_all(&content);
        }
        None => {
            let body = b"HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
            let _ = stream.write_all(body);
        }
    }
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    let dir = PathBuf::from(&path);
    if !dir.is_dir() {
        return Err(format!("目录不存在: {}", path));
    }
    open::that(&dir).map_err(|e| format!("打开文件夹失败: {}", e))
}

#[tauri::command]
pub fn init_project_dir(workspace_root: String, session_id: String) -> Result<String, String> {
    let root = PathBuf::from(&workspace_root);
    if !root.is_dir() {
        return Err(format!("工作区目录不存在: {}", workspace_root));
    }

    let project_dir = root.join(&session_id);
    fs::create_dir_all(&project_dir).map_err(|e| format!("创建项目目录失败: {}", e))?;

    project_dir
        .canonicalize()
        .map(|p| p.to_string_lossy().into_owned())
        .map_err(|e| format!("解析项目目录失败: {}", e))
}

#[tauri::command]
pub fn write_project_files(dir: String, files: Vec<ProjectFile>) -> Result<(), String> {
    let base = PathBuf::from(&dir);
    if !base.is_dir() {
        return Err(format!("项目目录不存在: {}", dir));
    }

    let canonical_base = base
        .canonicalize()
        .map_err(|e| format!("解析项目目录失败: {}", e))?;

    for file in files {
        let relative = Path::new(&file.path);
        if relative.is_absolute()
            || relative
                .components()
                .any(|c| matches!(c, std::path::Component::ParentDir))
        {
            return Err(format!("非法文件路径: {}", file.path));
        }

        let target = canonical_base.join(relative);
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        fs::write(&target, &file.content)
            .map_err(|e| format!("写入文件 {} 失败: {}", file.path, e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn start_preview_server(
    state: tauri::State<'_, PreviewServerState>,
    project_dir: String,
) -> Result<u16, String> {
    let root = PathBuf::from(&project_dir);
    if find_entry_html(&root).is_none() {
        return Err("项目目录中不存在可预览的 HTML 页面".into());
    }

    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("解析项目目录失败: {}", e))?;

    let listener =
        TcpListener::bind("127.0.0.1:0").map_err(|e| format!("绑定端口失败: {}", e))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("获取端口失败: {}", e))?
        .port();

    listener
        .set_nonblocking(true)
        .map_err(|e| format!("设置非阻塞模式失败: {}", e))?;

    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_flag = Arc::clone(&shutdown);
    let root_for_thread = canonical_root.clone();

    let handle = thread::spawn(move || {
        loop {
            if shutdown_flag.load(Ordering::Relaxed) {
                break;
            }

            match listener.accept() {
                Ok((mut stream, _)) => {
                    handle_connection(&mut stream, &root_for_thread);
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(50));
                }
                Err(_) => break,
            }
        }
    });

    state.0.lock().unwrap().insert(
        port,
        PreviewServer {
            shutdown,
            handle: Some(handle),
        },
    );

    Ok(port)
}

#[tauri::command]
pub fn stop_preview_server(
    state: tauri::State<'_, PreviewServerState>,
    port: u16,
) -> Result<(), String> {
    let server = {
        let mut servers = state.0.lock().unwrap();
        servers.remove(&port)
    };

    if let Some(server) = server {
        server.shutdown.store(true, Ordering::Relaxed);
        if let Some(handle) = server.handle {
            thread::spawn(move || {
                let _ = handle.join();
            });
        }
        Ok(())
    } else {
        Err(format!("未找到端口 {} 对应的预览服务", port))
    }
}
