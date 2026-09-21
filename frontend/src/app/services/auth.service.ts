import { Injectable } from '@angular/core';

const TOKEN_KEY = 'demo-access-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken(): string {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  }

  setToken(token: string): void {
    const value = token.trim();
    if (value) {
      sessionStorage.setItem(TOKEN_KEY, value);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }

  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
