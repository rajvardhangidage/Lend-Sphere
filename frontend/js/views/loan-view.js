/**
 * Loan Marketplace, EMI Calculator, Applications & Repayment Schedule View
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { AuthView } from './auth-view.js';
import { PaymentView } from './payment-view.js';

export class LoanView {
  static async renderMarketplace(container) {
    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            Loan Products Catalog
          </h2>
          <p>Transparent digital credit options tailored to your personal or business capital requirements.</p>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="products-grid" id="products-grid-container">
        <div style="grid-column: 1 / -1; text-align:center; padding: 40px;">
          <span class="mono" style="color:var(--text-muted);">Fetching loan products...</span>
        </div>
      </div>
    `;

    const grid = container.querySelector('#products-grid-container');

    try {
      const products = await ApiClient.get(CONFIG.API.LOANS.PRODUCTS);
      if (!products || products.length === 0) {
        grid.innerHTML = `
          <div class="glass-panel empty-state" style="grid-column: 1 / -1;">
            <p>No active loan products currently configured in the database.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = products.map(product => `
        <div class="glass-panel product-card">
          <div>
            <div class="product-header">
              <span class="product-name">${product.name}</span>
              <span class="product-rate-badge">${product.annualInterestRate}% APR</span>
            </div>

            <p style="font-size:0.85rem; margin-top:8px; margin-bottom:16px;">
              Instant digital loan with automated credit scoring, flexible tenures, and competitive fixed rates.
            </p>

            <div class="product-spec-list">
              <div class="spec-item">
                <span class="spec-label">Min Amount</span>
                <span class="spec-value mono">$${Number(product.minAmount).toLocaleString()}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Max Amount</span>
                <span class="spec-value mono">$${Number(product.maxAmount).toLocaleString()}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Max Tenure</span>
                <span class="spec-value mono">${product.maxTenureMonths} Months</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Status</span>
                <span class="badge ${product.active ? 'badge-success' : 'badge-danger'}">
                  ${product.active ? 'Available' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="window.openEmiCalculator('${product.id}', '${product.name}', ${product.minAmount}, ${product.maxAmount}, ${product.annualInterestRate}, ${product.maxTenureMonths})">
              Calculate EMI
            </button>
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.applyLoanModal('${product.id}', '${product.name}', ${product.minAmount}, ${product.maxAmount}, ${product.annualInterestRate}, ${product.maxTenureMonths})">
              Apply Now
            </button>
          </div>
        </div>
      `).join('');

      // Setup window modal triggers
      window.openEmiCalculator = LoanView.openEmiCalculator;
      window.applyLoanModal = LoanView.openApplyModal;
    } catch (err) {
      grid.innerHTML = `
        <div class="glass-panel empty-state" style="grid-column: 1 / -1; color:var(--accent-rose);">
          <p>Failed to load loan products: ${err.message}</p>
        </div>
      `;
    }
  }

  static openEmiCalculator(productId, name, minAmount, maxAmount, apr, maxTenure) {
    const defaultAmount = Math.max(minAmount, 25000);
    const defaultTenure = Math.min(maxTenure, 12);

    const contentHtml = `
      <div class="calculator-box">
        <h4 style="margin-bottom:16px;">Simulate Monthly Repayment: ${name}</h4>
        
        <div class="form-group">
          <div class="form-label">
            <span>Loan Amount</span>
            <span class="mono" style="color:var(--primary); font-weight:700;" id="calc-amount-val">$${defaultAmount.toLocaleString()}</span>
          </div>
          <input type="range" id="calc-amount-slider" min="${minAmount}" max="${maxAmount}" step="1000" value="${defaultAmount}" />
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
            <span>$${minAmount.toLocaleString()}</span>
            <span>$${maxAmount.toLocaleString()}</span>
          </div>
        </div>

        <div class="form-group">
          <div class="form-label">
            <span>Tenure (Months)</span>
            <span class="mono" style="color:var(--accent-cyan); font-weight:700;" id="calc-tenure-val">${defaultTenure} Months</span>
          </div>
          <input type="range" id="calc-tenure-slider" min="1" max="${maxTenure}" step="1" value="${defaultTenure}" />
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted);">
            <span>1 Month</span>
            <span>${maxTenure} Months</span>
          </div>
        </div>

        <div class="calc-display">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Estimated Monthly EMI</div>
            <div class="calc-emi-amount mono" id="calc-emi-result">$0.00</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Fixed Interest Rate</div>
            <div class="mono" style="font-weight:700; color:var(--text-primary);">${apr}% APR</div>
          </div>
        </div>
      </div>
    `;

    Modal.open(`EMI Calculator — ${name}`, contentHtml, [
      {
        label: 'Apply with these Terms',
        className: 'btn-primary',
        onClick: () => {
          const amt = document.getElementById('calc-amount-slider').value;
          const tenure = document.getElementById('calc-tenure-slider').value;
          Modal.close();
          LoanView.openApplyModal(productId, name, minAmount, maxAmount, apr, maxTenure, amt, tenure);
        }
      }
    ]);

    const updateCalc = () => {
      const p = parseFloat(document.getElementById('calc-amount-slider').value);
      const n = parseInt(document.getElementById('calc-tenure-slider').value);
      document.getElementById('calc-amount-val').innerText = `$${p.toLocaleString()}`;
      document.getElementById('calc-tenure-val').innerText = `${n} Months`;

      // Monthly rate
      const r = (apr / 100) / 12;
      let emi = 0;
      if (r > 0) {
        emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      } else {
        emi = p / n;
      }
      document.getElementById('calc-emi-result').innerText = `$${emi.toFixed(2)}`;
    };

    document.getElementById('calc-amount-slider').oninput = updateCalc;
    document.getElementById('calc-tenure-slider').oninput = updateCalc;
    updateCalc();
  }

  static openApplyModal(productId, name, minAmount, maxAmount, apr, maxTenure, initialAmt = 50000, initialTenure = 12) {
    if (!state.isAuthenticated()) {
      Modal.close();
      AuthView.openModal();
      Toast.info('Login Required', 'Please sign in or register before applying for a loan.');
      return;
    }

    const contentHtml = `
      <form id="loan-apply-form">
        <div style="margin-bottom:16px;">
          <p style="font-size:0.85rem;">Applying for: <strong>${name}</strong> (${apr}% APR)</p>
          <p style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${productId}</p>
        </div>

        <div class="form-group">
          <label class="form-label">Requested Loan Amount ($)</label>
          <input type="number" id="apply-amount" class="form-control mono" min="${minAmount}" max="${maxAmount}" step="100" value="${initialAmt}" required />
          <span style="font-size:0.75rem; color:var(--text-muted);">Range: $${minAmount.toLocaleString()} – $${maxAmount.toLocaleString()}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Tenure (Months)</label>
          <input type="number" id="apply-tenure" class="form-control mono" min="1" max="${maxTenure}" value="${initialTenure}" required />
          <span style="font-size:0.75rem; color:var(--text-muted);">Max: ${maxTenure} months</span>
        </div>

        <div class="product-spec-list" style="margin-top:16px;">
          <div class="spec-item">
            <span class="spec-label">Customer ID</span>
            <span class="spec-value mono">${state.user?.id || '—'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Initial Status</span>
            <span class="badge badge-warning">PENDING UNDERWRITING</span>
          </div>
        </div>

        <div style="margin-top:24px;">
          <button type="submit" class="btn btn-primary" style="width:100%;" id="btn-submit-application">
            Submit Loan Application
          </button>
        </div>
      </form>
    `;

    Modal.open(`Apply for Loan — ${name}`, contentHtml);

    const form = document.getElementById('loan-apply-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('apply-amount').value);
      const tenureMonths = parseInt(document.getElementById('apply-tenure').value);
      const submitBtn = document.getElementById('btn-submit-application');

      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting Application...';

      try {
        const application = await ApiClient.post(CONFIG.API.LOANS.APPLICATIONS, {
          productId,
          amount,
          tenureMonths
        });

        Toast.success('Application Submitted', `Loan application #${application.id.substring(0, 8)} created successfully.`);
        Modal.close();
        state.setActiveTab('my-loans');
      } catch (err) {
        Toast.error('Application Error', err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Loan Application';
      }
    };
  }

  static async renderMyLoans(container) {
    if (!state.isAuthenticated()) {
      container.innerHTML = `
        <div class="glass-panel empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <h3>Sign In Required</h3>
          <p>Please authenticate to view your loan applications and repayment schedules.</p>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            My Loan Applications & Schedule
          </h2>
          <p>Track your active applications, approval status, and upcoming installment schedules.</p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-refresh-loans">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Refresh
        </button>
      </div>

      <div class="glass-panel" style="padding: var(--space-6);">
        <div class="data-table-container">
          <table class="data-table" id="my-loans-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Tenure</th>
                <th>Status</th>
                <th>Applied At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="my-loans-tbody">
              <tr><td colspan="6" style="text-align:center; padding:30px;"><span class="mono">Loading loan applications...</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const loadLoans = async () => {
      const tbody = container.querySelector('#my-loans-tbody');
      try {
        const loans = await ApiClient.get(CONFIG.API.LOANS.APPLICATIONS);
        if (!loans || loans.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align:center; padding:40px;">
                <p style="margin-bottom:8px;">You don't have any loan applications yet.</p>
                <button class="btn btn-primary btn-sm" onclick="state.setActiveTab('marketplace')">Explore Products</button>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = loans.map(loan => {
          let statusBadge = '<span class="badge badge-warning">PENDING</span>';
          if (loan.status === 'APPROVED') {
            statusBadge = '<span class="badge badge-success">APPROVED</span>';
          } else if (loan.status === 'REJECTED') {
            statusBadge = '<span class="badge badge-danger">REJECTED</span>';
          }

          const createdDate = loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : '—';

          return `
            <tr>
              <td><span class="mono" style="color:var(--text-primary); font-weight:600;">#${loan.id.substring(0, 8)}</span></td>
              <td><span class="mono font-bold" style="color:var(--primary); font-weight:700;">$${Number(loan.amount).toLocaleString()}</span></td>
              <td><span class="mono">${loan.tenureMonths} Months</span></td>
              <td>${statusBadge}</td>
              <td>${createdDate}</td>
              <td>
                <div style="display:flex; gap:6px;">
                  ${loan.status === 'APPROVED' ? `
                    <button class="btn btn-secondary btn-sm" onclick="window.viewAmortizationSchedule('${loan.id}')">
                      Schedule
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.openRepayModal('${loan.id}')">
                      Pay EMI
                    </button>
                  ` : `
                    <span style="font-size:0.8rem; color:var(--text-muted);">Under Review</span>
                  `}
                </div>
              </td>
            </tr>
          `;
        }).join('');

        window.viewAmortizationSchedule = LoanView.viewScheduleModal;
        window.openRepayModal = (loanId) => PaymentView.openRepayModal(loanId);
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-rose); text-align:center; padding:20px;">Failed to load applications: ${err.message}</td></tr>`;
      }
    };

    container.querySelector('#btn-refresh-loans').onclick = loadLoans;
    await loadLoans();
  }

  static async viewScheduleModal(loanId) {
    Modal.open(`Repayment Schedule — #${loanId.substring(0, 8)}`, `
      <div style="text-align:center; padding: 40px;">
        <span class="mono" style="color:var(--text-muted);">Fetching amortization schedule...</span>
      </div>
    `);

    try {
      const schedule = await ApiClient.get(CONFIG.API.LOANS.SCHEDULE(loanId));
      if (!schedule || schedule.length === 0) {
        Modal.open(`Repayment Schedule — #${loanId.substring(0, 8)}`, `
          <div style="text-align:center; padding: 30px;">
            <p>No repayment installments recorded for this loan.</p>
          </div>
        `);
        return;
      }

      const totalRepayment = schedule.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0);

      const tableRows = schedule.map(item => {
        const isPaid = item.status === 'PAID';
        const badge = isPaid
          ? '<span class="badge badge-success">PAID</span>'
          : '<span class="badge badge-warning">DUE</span>';

        return `
          <tr>
            <td><span class="mono font-bold">#${item.installmentNumber}</span></td>
            <td><span class="mono">${item.dueDate || '—'}</span></td>
            <td><span class="mono">$${Number(item.principal).toFixed(2)}</span></td>
            <td><span class="mono">$${Number(item.interest).toFixed(2)}</span></td>
            <td><span class="mono" style="font-weight:700; color:var(--primary);">$${Number(item.totalAmount).toFixed(2)}</span></td>
            <td>${badge}</td>
          </tr>
        `;
      }).join('');

      const scheduleHtml = `
        <div style="display:flex; justify-content:space-between; margin-bottom:16px; padding:12px; background:rgba(0,0,0,0.2); border-radius:var(--radius-md);">
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Loan Obligation</span>
            <div class="mono" style="font-size:1.3rem; font-weight:800; color:var(--primary);">$${totalRepayment.toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Installments</span>
            <div class="mono" style="font-size:1.3rem; font-weight:800;">${schedule.length} Months</div>
          </div>
        </div>

        <div class="data-table-container" style="max-height:360px; overflow-y:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total EMI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;

      Modal.open(`Repayment Schedule — #${loanId.substring(0, 8)}`, scheduleHtml, [
        {
          label: 'Pay Installment',
          className: 'btn-primary',
          onClick: () => {
            Modal.close();
            PaymentView.openRepayModal(loanId, schedule[0]?.totalAmount || 5000);
          }
        }
      ]);
    } catch (err) {
      Modal.open(`Repayment Schedule`, `<p style="color:var(--accent-rose);">Error fetching schedule: ${err.message}</p>`);
    }
  }
}
