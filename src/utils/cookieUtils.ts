/**
 * Cookie utility functions for managing browser cookies
 */

export interface CookieOptions {
  maxAge?: number; // in seconds
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const {
    maxAge,
    expires,
    path = '/',
    domain,
    secure,
    sameSite = 'lax'
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += `; secure`;
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    const trimmedCookie = cookie.trim();
    const [cookieName, cookieValue] = trimmedCookie.split('=');
    
    if (decodeURIComponent(cookieName) === name) {
      return decodeURIComponent(cookieValue || '');
    }
  }
  
  return null;
}

/**
 * Delete a cookie by setting its expiration date to the past
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): void {
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}