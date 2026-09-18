/**
 * Top Navigation Bar & Role Switcher
 */

import { state } from '../state.js';
import { AuthView } from '../views/auth-view.js';
import { Toast } from './toast.js';

export class Navbar {
  static render(container) {
    const isAuth = state.isAuthenticated();
    const user = state.user;
    const isOfficerOrAdmin = state.isOfficerOrAdmin();

    container.innerHTML = `
      <div class="brand-container">
        <div class="brand-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="brand-title-group">
          <span class="brand-title">LENDIQ</span>
          <span class="brand-subtitle">Digital Credit & Lending</span>
        </div>
      </div>

      <nav class="nav-tabs" id="nav-tabs-container">
        <button class="nav-tab-btn ${state.activeTab === 'marketplace' ? 'active' : ''}" data-tab="marketplace">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          Marketplace
        </button>
        <button class="nav-tab-btn ${state.activeTab === 'my-loans' ? 'active' : ''}" data-tab="my-loans">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          My Loans & Schedule
        </button>
        <button class="nav-tab-btn ${state.activeTab === 'payments' ? 'active' : ''}" data-tab="payments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Payments
        </button>
        ${isOfficerOrAdmin ? `
          <button class="nav-tab-btn ${state.activeTab === 'underwriting' ? 'active' : ''}" data-tab="underwriting">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Underwriting
          </button>
        ` : ''}
        <button class="nav-tab-btn ${state.activeTab === 'notifications' ? 'active' : ''}" data-tab="notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          Notifications
        </button>
        <button class="nav-tab-btn ${state.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile & KYC
        </button>
      </nav>

      <div class="header-actions">
        <!-- Quick Switcher for instant role demo -->
        <div class="quick-switch-dropdown">
          <span style="color:var(--text-muted); font-size: 0.75rem;">Demo Persona:</span>
          <button class="btn btn-secondary btn-sm" id="btn-quick-admin" title="Login as Admin">Admin</button>
          <button class="btn btn-secondary btn-sm" id="btn-quick-officer" title="Login as Loan Officer">Officer</button>
          <button class="btn btn-secondary btn-sm" id="btn-quick-customer" title="Login as Customer">Customer</button>
        </div>

        ${isAuth ? `
          <div class="user-badge-container">
            <div class="user-avatar">${(user?.email || 'U')[0].toUpperCase()}</div>
            <div class="user-meta">
              <span class="user-email">${user?.email || 'User'}</span>
              <span class="user-role-label">${user?.role || 'CUSTOMER'}</span>
            </div>
            <button class="btn btn-outline btn-sm" id="btn-logout" title="Sign out" style="padding:0.2rem 0.5rem; margin-left:4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        ` : `
          <button class="btn btn-primary btn-sm" id="btn-open-auth">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Sign In / Register
          </button>
        `}
      </div>
    `;

    // Attach Tab listeners
    container.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.getAttribute('data-tab');
        state.setActiveTab(tab);
      };
    });

    // Attach Quick Logins
    container.querySelector('#btn-quick-admin').onclick = () => AuthView.quickLogin('ADMIN');
    container.querySelector('#btn-quick-officer').onclick = () => AuthView.quickLogin('OFFICER');
    container.querySelector('#btn-quick-customer').onclick = () => AuthView.quickLogin('CUSTOMER');

    // Attach Auth button
    const authBtn = container.querySelector('#btn-open-auth');
    if (authBtn) authBtn.onclick = () => AuthView.openModal();

    // Attach Logout
    const logoutBtn = container.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        state.setSession(null, null);
        Toast.info('Signed Out', 'You have been successfully signed out.');
      };
    }
  }
}
