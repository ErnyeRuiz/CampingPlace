import { Injectable } from '@angular/core';
import { LOCAL_STORAGE_KEYS } from '../constants/local-storage.keys';
import { LoginResponse } from '../models/auth/login-response';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  getJson<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  setJson(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  saveAuthSession(data: LoginResponse): void {
    if (data.token) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, data.token);
    }
    this.setJson(LOCAL_STORAGE_KEYS.AUTH_USER, data);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  }

  getStoredAuthUser(): LoginResponse | null {
    return this.getJson<LoginResponse>(LOCAL_STORAGE_KEYS.AUTH_USER);
  }

  /** Removes JWT and persisted user profile (call on logout). */
  clearAuthSession(): void {
    this.remove(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    this.remove(LOCAL_STORAGE_KEYS.AUTH_USER);
  }
}
