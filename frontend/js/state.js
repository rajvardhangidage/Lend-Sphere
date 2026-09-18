/**
 * Simple Reactive State & Event Bus
 */

class AppState {
  constructor() {
    this.token = localStorage.getItem('fintech_token') || null;
    this.user = JSON.parse(localStorage.getItem('fintech_user') || 'null');
    this.customer = JSON.parse(localStorage.getItem('fintech_customer') || 'null');
    this.activeTab = 'marketplace';
    this.listeners = new Map();
  }

  // Subscribe to state change events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  // Emit event to subscribers
  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in subscriber for event "${event}":`, err);
        }
      }
    }
  }

  // Session Management
  setSession(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('fintech_token', token);
      localStorage.setItem('fintech_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fintech_token');
      localStorage.removeItem('fintech_user');
      localStorage.removeItem('fintech_customer');
      this.customer = null;
    }
    this.emit('authChange', { token, user });
  }

  setCustomerProfile(customer) {
    this.customer = customer;
    if (customer) {
      localStorage.setItem('fintech_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('fintech_customer');
    }
    this.emit('customerChange', customer);
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.emit('tabChange', tab);
  }

  isAuthenticated() {
    return !!this.token;
  }

  isOfficerOrAdmin() {
    if (!this.user || !this.user.role) return false;
    const role = this.user.role.toUpperCase();
    return role === 'ADMIN' || role === 'LOAN_OFFICER' || role === 'ROLE_ADMIN' || role === 'ROLE_LOAN_OFFICER';
  }

  isAdmin() {
    if (!this.user || !this.user.role) return false;
    const role = this.user.role.toUpperCase();
    return role === 'ADMIN' || role === 'ROLE_ADMIN';
  }
}

export const state = new AppState();
