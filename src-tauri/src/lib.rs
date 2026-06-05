mod preview_server;

use preview_server::{
    init_project_dir, start_preview_server, stop_preview_server, write_project_files,
    PreviewServerState,
};
use std::collections::HashMap;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(PreviewServerState(Mutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![
            init_project_dir,
            write_project_files,
            start_preview_server,
            stop_preview_server,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
