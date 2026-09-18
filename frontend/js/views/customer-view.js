/**
 * Customer Profile & KYC View
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/toast.js';
import { AuthView } from './auth-view.js';

export class CustomerView {
  static async render(container) {
    if (!state.isAuthenticated()) {
      container.innerHTML = `
        <div class="glass-panel empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3>Sign In Required</h3>
          <p>Please authenticate to access or manage your Customer Profile and KYC verification.</p>
          <button class="btn btn-primary" onclick="window.openAuthModal()">Sign In</button>
        </div>
      `;
      window.openAuthModal = () => AuthView.openModal();
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Customer Profile & Identity
          </h2>
          <p>Verified legal identity and compliance records for authorized credit disbursement.</p>
        </div>
      </div>

      <div class="grid-2col">
        <!-- Profile & KYC Card -->
        <div class="glass-panel" style="padding: var(--space-6);" id="profile-container">
          <div style="display:flex; justify-content:center; padding: 40px;">
            <span class="mono" style="color:var(--text-muted);">Loading profile data...</span>
          </div>
        </div>

        <!-- Customer Lookup by ID Tool -->
        <div class="glass-panel" style="padding: var(--space-6);">
          <h3 style="margin-bottom:var(--space-2); display:flex; align-items:center; gap:8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Member Identity Verification
          </h3>
          <p style="font-size:0.85rem; margin-bottom:var(--space-4);">Lookup and verify customer credentials and KYC standing by Account ID.</p>

          <div class="form-group">
            <label class="form-label">Customer Account ID</label>
            <div style="display:flex; gap:8px;">
              <input type="text" id="lookup-customer-id" class="form-control mono" placeholder="e.g. 00000000-0000-0000-0000-000000000000" />
              <button class="btn btn-secondary" id="btn-lookup-customer">Verify</button>
            </div>
          </div>

          <div id="lookup-result-box" style="margin-top:16px;"></div>
        </div>
      </div>
    `;

    // Fetch and render current customer profile
    await CustomerView.loadProfile(container.querySelector('#profile-container'));

    // Attach Lookup handler
    const lookupBtn = container.querySelector('#btn-lookup-customer');
    lookupBtn.onclick = async () => {
      const id = container.querySelector('#lookup-customer-id').value.trim();
      const resultBox = container.querySelector('#lookup-result-box');
      if (!id) {
        Toast.error('Invalid Input', 'Please enter a valid Customer ID');
        return;
      }

      resultBox.innerHTML = '<span class="mono" style="color:var(--text-muted);">Verifying records...</span>';
      try {
        const customer = await ApiClient.get(`${CONFIG.API.CUSTOMERS.BASE}/${id}`);
        resultBox.innerHTML = `
          <div style="padding:14px; background:rgba(0,0,0,0.2); border-radius:var(--radius-md); border:1px solid var(--glass-border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong>${customer.fullName}</strong>
              <span class="badge ${customer.kycStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'}">${customer.kycStatus || 'ACTIVE'}</span>
            </div>
            <div style="font-size:0.82rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
              <div>Phone: <span class="mono">${customer.phone || '—'}</span></div>
              <div>Date of Birth: <span class="mono">${customer.dateOfBirth || '—'}</span></div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">ID: <span class="mono">${customer.id}</span></div>
            </div>
          </div>
        `;
      } catch (err) {
        resultBox.innerHTML = `<div style="color:var(--accent-rose); font-size:0.85rem;">Account not found or access restricted.</div>`;
      }
    };
  }

  static async loadProfile(container) {
    try {
      const profile = await ApiClient.get(CONFIG.API.CUSTOMERS.ME);
      state.setCustomerProfile(profile);

      const kycBadge = profile.kycStatus === 'VERIFIED'
        ? '<span class="badge badge-success">KYC Verified</span>'
        : `<span class="badge badge-warning">${profile.kycStatus || 'PENDING'}</span>`;

      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <div>
            <h3 style="font-size:1.3rem;">${profile.fullName || 'Customer'}</h3>
            <span class="mono" style="font-size:0.75rem; color:var(--text-muted);">${profile.id}</span>
          </div>
          ${kycBadge}
        </div>

        <div class="product-spec-list" style="margin-bottom:24px;">
          <div class="spec-item">
            <span class="spec-label">Phone Number</span>
            <span class="spec-value mono">${profile.phone || 'Not provided'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Date of Birth</span>
            <span class="spec-value mono">${profile.dateOfBirth || 'Not provided'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">User Email</span>
            <span class="spec-value">${state.user?.email || '—'}</span>
          </div>
        </div>

        <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Identity verified. Account is approved for instant digital borrowing.
        </div>
      `;
    } catch {
      // Profile does not exist yet; show creation form
      container.innerHTML = `
        <div style="margin-bottom:16px;">
          <h3 style="margin-bottom:4px;">Complete Borrower Profile</h3>
          <p style="font-size:0.85rem;">Provide your legal details to activate your credit borrowing line.</p>
        </div>

        <form id="create-customer-form">
          <div class="form-group">
            <label class="form-label">Legal Full Name</label>
            <input type="text" id="cust-name" class="form-control" placeholder="e.g. Johnathan Doe" required />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="cust-phone" class="form-control" placeholder="e.g. +1 555-0199" required />
          </div>

          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <input type="date" id="cust-dob" class="form-control" value="1995-06-15" required />
          </div>

          <button type="submit" class="btn btn-primary" id="btn-save-profile" style="width:100%; margin-top:12px;">
            Save & Verify Profile
          </button>
        </form>
      `;

      const form = container.querySelector('#create-customer-form');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const fullName = container.querySelector('#cust-name').value.trim();
        const phone = container.querySelector('#cust-phone').value.trim();
        const dateOfBirth = container.querySelector('#cust-dob').value;

        const btn = container.querySelector('#btn-save-profile');
        btn.disabled = true;
        btn.innerText = 'Creating Profile...';

        try {
          const res = await ApiClient.post(CONFIG.API.CUSTOMERS.BASE, {
            fullName,
            phone,
            dateOfBirth
          });
          Toast.success('Profile Created', `Customer profile registered for ${res.fullName}`);
          state.setCustomerProfile(res);
          CustomerView.loadProfile(container);
        } catch (err) {
          Toast.error('Profile Creation Failed', err.message);
          btn.disabled = false;
          btn.innerText = 'Save & Verify Profile';
        }
      };
    }
  }
}
