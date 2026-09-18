/**
 * Authentication View & Modals
 * Supports Login, Registration, Preset Fast-Login, and Token Introspection
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export class AuthView {
  static openModal(defaultMode = 'login') {
    const isLogin = defaultMode === 'login';

    const contentHtml = `
      <div id="auth-modal-tabs" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
        <button class="btn ${isLogin ? 'btn-primary' : 'btn-secondary'} btn-sm" id="tab-auth-login" style="flex:1;">Sign In</button>
        <button class="btn ${!isLogin ? 'btn-primary' : 'btn-secondary'} btn-sm" id="tab-auth-register" style="flex:1;">Create Account</button>
      </div>

      <form id="auth-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="auth-email" class="form-control" placeholder="user@lending.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="auth-password" class="form-control" placeholder="••••••••" minlength="8" required />
          <span style="font-size:0.75rem; color:var(--text-muted);">Must be at least 8 characters</span>
        </div>

        ${!isLogin ? `
          <div class="form-group" id="role-group">
            <label class="form-label">Role</label>
            <select id="auth-role" class="form-control">
              <option value="CUSTOMER">Customer (Borrower)</option>
              <option value="LOAN_OFFICER">Loan Officer (Underwriter)</option>
              <option value="ADMIN">Platform Administrator</option>
            </select>
          </div>
        ` : ''}

        <div style="margin-top: 24px;">
          <button type="submit" class="btn btn-primary" style="width:100%;" id="btn-submit-auth">
            ${isLogin ? 'Sign In to Platform' : 'Create & Register Account'}
          </button>
        </div>
      </form>

      <div style="margin-top: 20px; padding: 12px; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">Quick Demo Profiles:</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="window.setPresetAuth('ADMIN')">Credit Admin</button>
          <button class="btn btn-outline btn-sm" onclick="window.setPresetAuth('OFFICER')">Underwriter Officer</button>
        </div>
      </div>
    `;

    Modal.open(isLogin ? 'Sign In to Lendiq' : 'Create an Account', contentHtml);

    // Global helper for preset buttons
    window.setPresetAuth = (presetKey) => {
      const preset = CONFIG.PRESET_ACCOUNTS[presetKey];
      if (preset) {
        document.getElementById('auth-email').value = preset.email;
        document.getElementById('auth-password').value = preset.password;
      }
    };

    // Tab switching
    document.getElementById('tab-auth-login').onclick = () => AuthView.openModal('login');
    document.getElementById('tab-auth-register').onclick = () => AuthView.openModal('register');

    // Submit handler
    const form = document.getElementById('auth-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const roleSelect = document.getElementById('auth-role');
      const role = roleSelect ? roleSelect.value : undefined;

      const submitBtn = document.getElementById('btn-submit-auth');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Authenticating...';

      try {
        let tokenResponse;
        if (isLogin) {
          tokenResponse = await ApiClient.post(CONFIG.API.AUTH.LOGIN, { email, password });
          Toast.success('Welcome Back', `Successfully signed in as ${email}`);
        } else {
          tokenResponse = await ApiClient.post(CONFIG.API.AUTH.REGISTER, { email, password, role });
          Toast.success('Account Created', `Registered new account as ${role || 'CUSTOMER'}`);
        }

        const token = tokenResponse.accessToken || tokenResponse.token;
        if (!token) throw new Error('No access token received from authentication provider');

        // Fetch User Identity via /api/v1/auth/me
        state.token = token; // temporary set to allow call
        const user = await ApiClient.get(CONFIG.API.AUTH.ME, {
          headers: { Authorization: `Bearer ${token}` }
        });

        state.setSession(token, user);
        Modal.close();

        // If Customer, check if profile exists
        if (!state.isOfficerOrAdmin()) {
          AuthView.checkCustomerProfile();
        }
      } catch (err) {
        Toast.error('Authentication Failed', err.message || 'Check your credentials.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isLogin ? 'Sign In to Platform' : 'Create & Register Account';
      }
    };
  }

  static async quickLogin(presetKey) {
    const preset = CONFIG.PRESET_ACCOUNTS[presetKey];
    if (!preset) return;

    try {
      Toast.info('Authenticating', `Logging in as ${preset.role}...`);
      const tokenResponse = await ApiClient.post(CONFIG.API.AUTH.LOGIN, {
        email: preset.email,
        password: preset.password
      });

      const token = tokenResponse.accessToken || tokenResponse.token;
      state.token = token;

      const user = await ApiClient.get(CONFIG.API.AUTH.ME, {
        headers: { Authorization: `Bearer ${token}` }
      });

      state.setSession(token, user);
      Toast.success('Authenticated', `Active as ${user.email} [${user.role}]`);

      // Switch to relevant tab
      if (state.isOfficerOrAdmin()) {
        state.setActiveTab('underwriting');
      } else {
        state.setActiveTab('marketplace');
        AuthView.checkCustomerProfile();
      }
    } catch (err) {
      // If customer doesn't exist yet, try to auto-register
      if (presetKey === 'CUSTOMER') {
        try {
          const regRes = await ApiClient.post(CONFIG.API.AUTH.REGISTER, {
            email: preset.email,
            password: preset.password,
            role: 'CUSTOMER'
          });
          const token = regRes.accessToken;
          state.token = token;
          const user = await ApiClient.get(CONFIG.API.AUTH.ME, {
            headers: { Authorization: `Bearer ${token}` }
          });
          state.setSession(token, user);
          Toast.success('Created & Signed In', `Welcome ${user.email}`);
          AuthView.checkCustomerProfile();
          return;
        } catch (regErr) {
          Toast.error('Login Failed', regErr.message);
        }
      } else {
        Toast.error('Login Failed', err.message);
      }
    }
  }

  static async checkCustomerProfile() {
    try {
      const profile = await ApiClient.get(CONFIG.API.CUSTOMERS.ME);
      state.setCustomerProfile(profile);
    } catch {
      // Profile does not exist yet for this customer
      state.setCustomerProfile(null);
    }
  }
}
