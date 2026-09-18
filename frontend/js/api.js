/**
 * Centralized API Client
 * Wraps native fetch with JWT authorization headers, Idempotency-Key generation, and Spring Boot error handling.
 */

import { CONFIG } from './config.js';
import { state } from './state.js';

export class ApiClient {
  /**
   * Performs an HTTP request against the API Gateway
   */
  static async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${CONFIG.GATEWAY_URL}${path}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Inject JWT Bearer Token if logged in
    if (state.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        // Parse Spring Boot error response if available
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        if (data && typeof data === 'object') {
          if (data.message) errorMessage = data.message;
          else if (data.error) errorMessage = data.error;
          else if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.map(e => e.defaultMessage || e).join(', ');
          }
        }
        
        // Handle 401 Unauthorized (expired token)
        if (response.status === 401 && state.token) {
          console.warn('Session expired or invalid token');
        }

        const err = new Error(errorMessage);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${path}:`, error);
      throw error;
    }
  }

  // HTTP Helper shortcuts
  static get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  static post(path, body = null, options = {}) {
    return this.request(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  static put(path, body = null, options = {}) {
    return this.request(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  static delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to generate a compliant UUID v4 for payment idempotency
   */
  static generateUUID() {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
