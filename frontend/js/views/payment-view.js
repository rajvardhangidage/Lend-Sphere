/**
 * Payments & Idempotent Repayments View
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { AuthView } from './auth-view.js';

export class PaymentView {
  static async render(container) {
    if (!state.isAuthenticated()) {
      container.innerHTML = `
        <div class="glass-panel empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3>Sign In Required</h3>
          <p>Please authenticate to access payments and loan settlement history.</p>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Payments & Settlement Ledger
          </h2>
          <p>Real-time loan installment settlement with cryptographic transaction duplicate protection.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary btn-sm" id="btn-make-payment">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Execute Payment
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-payments">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="glass-panel" style="padding: var(--space-6);">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Loan Reference</th>
                <th>Amount Paid</th>
                <th>Transaction Reference</th>
                <th>Settlement Channel</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody id="payments-tbody">
              <tr><td colspan="7" style="text-align:center; padding:30px;"><span class="mono">Loading transaction ledger...</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const loadPayments = async () => {
      const tbody = container.querySelector('#payments-tbody');
      try {
        const payments = await ApiClient.get(CONFIG.API.PAYMENTS.BASE);
        if (!payments || payments.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" style="text-align:center; padding:40px;">
                <p style="margin-bottom:8px;">No payment transactions recorded for your account yet.</p>
                <button class="btn btn-primary btn-sm" onclick="window.openRepayModal()">Make a Payment</button>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = payments.map(p => {
          const isSuccess = p.status === 'SUCCESS';
          const badge = isSuccess
            ? '<span class="badge badge-success">SUCCESS</span>'
            : `<span class="badge badge-danger">${p.status}</span>`;

          const createdDate = p.createdAt ? new Date(p.createdAt).toLocaleString() : '—';

          return `
            <tr>
              <td><span class="mono font-bold" style="color:var(--text-primary);">#${p.id.substring(0, 8)}</span></td>
              <td><span class="mono" style="font-size:0.75rem; color:var(--text-muted);">#${p.loanId.substring(0, 8)}</span></td>
              <td><span class="mono" style="font-weight:700; color:var(--primary);">$${Number(p.amount).toFixed(2)}</span></td>
              <td><span class="mono" style="font-size:0.72rem; color:var(--text-muted);">${p.idempotencyKey.substring(0, 16)}...</span></td>
              <td><span class="mono" style="font-size:0.75rem; color:var(--accent-cyan);">${p.providerReference || 'SIM-DIRECT'}</span></td>
              <td>${badge}</td>
              <td style="font-size:0.8rem;">${createdDate}</td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--accent-rose); text-align:center; padding:20px;">Failed to load payments: ${err.message}</td></tr>`;
      }
    };

    container.querySelector('#btn-make-payment').onclick = () => PaymentView.openRepayModal();
    container.querySelector('#btn-refresh-payments').onclick = loadPayments;
    window.openRepayModal = (loanId, amount) => PaymentView.openRepayModal(loanId, amount);

    await loadPayments();
  }

  static openRepayModal(prefilledLoanId = '', prefilledAmount = 5000) {
    if (!state.isAuthenticated()) {
      AuthView.openModal();
      Toast.info('Sign In Required', 'Please log in to initiate an installment payment.');
      return;
    }

    let defaultKey = ApiClient.generateUUID();

    const contentHtml = `
      <form id="payment-form">
        <div class="form-group">
          <label class="form-label">Loan Application ID (UUID)</label>
          <input type="text" id="pay-loan-id" class="form-control mono" placeholder="00000000-0000-0000-0000-000000000000" value="${prefilledLoanId}" required />
          <span style="font-size:0.75rem; color:var(--text-muted);">The approved loan ID this payment is settling</span>
        </div>

        <div class="form-group">
          <label class="form-label">Repayment Amount ($)</label>
          <input type="number" id="pay-amount" class="form-control mono" min="0.01" step="0.01" value="${prefilledAmount}" required />
        </div>

        <div class="form-group">
          <div class="form-label">
            <span>Transaction Guarantee Reference</span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-regen-key" style="padding:0.1rem 0.4rem; font-size:0.7rem;">Regenerate Reference</button>
          </div>
          <input type="text" id="pay-idempotency-key" class="form-control mono" value="${defaultKey}" readonly required />
          <span style="font-size:0.75rem; color:var(--text-muted);">Cryptographic guarantee ensuring your payment is never duplicate-charged.</span>
        </div>

        <div style="margin-top:24px;">
          <button type="submit" class="btn btn-primary" style="width:100%;" id="btn-submit-payment">
            Authorize & Process Payment
          </button>
        </div>
      </form>
    `;

    Modal.open('Execute Loan Repayment', contentHtml);

    document.getElementById('btn-regen-key').onclick = () => {
      document.getElementById('pay-idempotency-key').value = ApiClient.generateUUID();
    };

    const form = document.getElementById('payment-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const loanId = document.getElementById('pay-loan-id').value.trim();
      const amount = parseFloat(document.getElementById('pay-amount').value);
      const idempotencyKey = document.getElementById('pay-idempotency-key').value.trim();
      const submitBtn = document.getElementById('btn-submit-payment');

      submitBtn.disabled = true;
      submitBtn.innerText = 'Processing Transaction...';

      try {
        const payment = await ApiClient.post(CONFIG.API.PAYMENTS.BASE, {
          loanId,
          amount
        }, {
          headers: {
            'Idempotency-Key': idempotencyKey
          }
        });

        Toast.success('Payment Settled', `Payment of $${amount.toFixed(2)} processed successfully. Credited to loan account.`);
        Modal.close();
        state.setActiveTab('payments');
      } catch (err) {
        Toast.error('Payment Failed', err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Authorize & Process Payment';
      }
    };
  }
}
