import type { User, LoginParams, RegisterParams, AuthTokens } from '@/types';

const AUTH_STORAGE_KEY = 'codeany-auth';
const USERS_STORAGE_KEY = 'codeany-users';

// ========== Local Storage Auth (默认模式，无需后端) ==========

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  avatar?: string;
  createdAt: number;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getStoredAuth(): { userId: string; token: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredAuth(auth: { userId: string; token: string } | null) {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateToken(): string {
  return 'tok_' + generateId() + generateId();
}

function toPublicUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    nickname: stored.nickname,
    avatar: stored.avatar,
    createdAt: stored.createdAt,
  };
}

// ========== Public API ==========

export async function registerWithEmail(params: RegisterParams): Promise<{ user: User; tokens: AuthTokens }> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300));

  if (params.password !== params.confirmPassword) {
    throw new Error('两次输入的密码不一致');
  }

  if (params.password.length < 6) {
    throw new Error('密码至少需要 6 个字符');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(params.email)) {
    throw new Error('请输入有效的邮箱地址');
  }

  const users = getStoredUsers();
  if (users.some(u => u.email === params.email)) {
    throw new Error('该邮箱已被注册');
  }

  const newUser: StoredUser = {
    id: generateId(),
    email: params.email,
    passwordHash: simpleHash(params.password),
    nickname: params.nickname || params.email.split('@')[0],
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  const token = generateToken();
  saveStoredAuth({ userId: newUser.id, token });

  return {
    user: toPublicUser(newUser),
    tokens: { accessToken: token, refreshToken: token },
  };
}

export async function loginWithEmail(params: LoginParams): Promise<{ user: User; tokens: AuthTokens }> {
  await new Promise(r => setTimeout(r, 300));

  const users = getStoredUsers();
  const user = users.find(u => u.email === params.email);

  if (!user) {
    throw new Error('该邮箱未注册');
  }

  if (user.passwordHash !== simpleHash(params.password)) {
    throw new Error('密码错误');
  }

  const token = generateToken();
  saveStoredAuth({ userId: user.id, token });

  return {
    user: toPublicUser(user),
    tokens: { accessToken: token, refreshToken: token },
  };
}

export async function logout(): Promise<void> {
  saveStoredAuth(null);
}

export async function getCurrentUser(): Promise<User | null> {
  const auth = getStoredAuth();
  if (!auth) return null;

  const users = getStoredUsers();
  const user = users.find(u => u.id === auth.userId);
  return user ? toPublicUser(user) : null;
}

export async function updateProfile(data: { nickname?: string; avatar?: string }): Promise<User> {
  const auth = getStoredAuth();
  if (!auth) throw new Error('未登录');

  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === auth.userId);
  if (idx < 0) throw new Error('用户不存在');

  if (data.nickname) users[idx].nickname = data.nickname;
  if (data.avatar) users[idx].avatar = data.avatar;
  saveStoredUsers(users);

  return toPublicUser(users[idx]);
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const auth = getStoredAuth();
  if (!auth) throw new Error('未登录');

  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === auth.userId);
  if (idx < 0) throw new Error('用户不存在');

  if (users[idx].passwordHash !== simpleHash(oldPassword)) {
    throw new Error('原密码错误');
  }

  if (newPassword.length < 6) {
    throw new Error('新密码至少需要 6 个字符');
  }

  users[idx].passwordHash = simpleHash(newPassword);
  saveStoredUsers(users);
}
