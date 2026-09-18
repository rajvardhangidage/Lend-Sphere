/**
 * Underwriting & Loan Officer Decision Engine View
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/toast.js';
import { LoanView } from './loan-view.js';

export class OfficerView {
  static async render(container) {
    if (!state.isAuthenticated() || !state.isOfficerOrAdmin()) {
      container.innerHTML = `
        <div class="glass-panel empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>Underwriter Access Restricted</h3>
          <p>This portal requires <strong>LOAN_OFFICER</strong> or <strong>ADMIN</strong> permissions to inspect and decide on incoming loan applications.</p>
          <div style="display:flex; gap:10px; margin-top:12px;">
            <button class="btn btn-primary" onclick="window.fastOfficerLogin()">Login as Loan Officer</button>
            <button class="btn btn-secondary" onclick="window.fastAdminLogin()">Login as Admin</button>
          </div>
        </div>
      `;
      window.fastOfficerLogin = () => import('./auth-view.js').then(m => m.AuthView.quickLogin('OFFICER'));
      window.fastAdminLogin = () => import('./auth-view.js').then(m => m.AuthView.quickLogin('ADMIN'));
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Underwriting & Decisioning Queue
          </h2>
          <p>Credit risk assessment, application decisioning, and automated schedule initialization.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-refresh-queue">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Refresh Queue
        </button>
      </div>

      <!-- Applications Queue Table -->
      <div class="glass-panel" style="padding: var(--space-6);">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Customer ID</th>
                <th>Requested Amount</th>
                <th>Tenure</th>
                <th>Status</th>
                <th>Applied At</th>
                <th>Underwriter Decision</th>
              </tr>
            </thead>
            <tbody id="officer-queue-tbody">
              <tr><td colspan="7" style="text-align:center; padding:30px;"><span class="mono">Loading decision queue...</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const loadQueue = async () => {
      const tbody = container.querySelector('#officer-queue-tbody');
      try {
        const apps = await ApiClient.get(CONFIG.API.LOANS.ALL_APPLICATIONS);
        if (!apps || apps.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px;">No loan applications pending in the system.</td></tr>`;
          return;
        }

        tbody.innerHTML = apps.map(app => {
          const isPending = app.status === 'PENDING';
          const isApproved = app.status === 'APPROVED';
          const isRejected = app.status === 'REJECTED';

          let statusBadge = '<span class="badge badge-warning">PENDING</span>';
          if (isApproved) statusBadge = '<span class="badge badge-success">APPROVED</span>';
          if (isRejected) statusBadge = '<span class="badge badge-danger">REJECTED</span>';

          const createdDate = app.createdAt ? new Date(app.createdAt).toLocaleString() : '—';

          return `
            <tr>
              <td><span class="mono font-bold" style="color:var(--text-primary);">#${app.id.substring(0, 8)}</span></td>
              <td><span class="mono" style="font-size:0.75rem; color:var(--text-muted);">${app.customerId}</span></td>
              <td><span class="mono" style="font-weight:700; color:var(--primary);">$${Number(app.amount).toLocaleString()}</span></td>
              <td><span class="mono">${app.tenureMonths} Mo</span></td>
              <td>${statusBadge}</td>
              <td style="font-size:0.8rem;">${createdDate}</td>
              <td>
                <div style="display:flex; gap:6px;">
                  ${isPending ? `
                    <button class="btn btn-primary btn-sm" onclick="window.officerDecision('${app.id}', 'approve')">
                      Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.officerDecision('${app.id}', 'reject')">
                      Reject
                    </button>
                  ` : `
                    <button class="btn btn-secondary btn-sm" onclick="window.viewAmortizationSchedule('${app.id}')">
                      Inspect Schedule
                    </button>
                  `}
                </div>
              </td>
            </tr>
          `;
        }).join('');

        window.viewAmortizationSchedule = LoanView.viewScheduleModal;
        window.officerDecision = async (loanId, action) => {
          const isApprove = action === 'approve';
          const endpoint = isApprove ? CONFIG.API.LOANS.APPROVE(loanId) : CONFIG.API.LOANS.REJECT(loanId);

          Toast.info('Processing Decision', `${isApprove ? 'Approving' : 'Rejecting'} loan application...`);
          try {
            const res = await ApiClient.post(endpoint);
            Toast.success('Decision Recorded', `Application #${res.id.substring(0, 8)} status updated to ${res.status}.`);
            loadQueue();
          } catch (err) {
            Toast.error('Decision Failed', err.message);
          }
        };
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--accent-rose); text-align:center; padding:20px;">Failed to load queue: ${err.message}</td></tr>`;
      }
    };

    container.querySelector('#btn-refresh-queue').onclick = loadQueue;
    await loadQueue();
  }
}
