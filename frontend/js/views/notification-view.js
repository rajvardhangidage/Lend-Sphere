/**
 * Notification Service & Kafka Event Consumer Stream View
 */

import { ApiClient } from '../api.js';
import { CONFIG } from '../config.js';
import { state } from '../state.js';

export class NotificationView {
  static pollTimer = null;

  static async render(container) {
    container.innerHTML = `
      <div class="section-header">
        <div class="section-header-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            Security & Activity Notifications
          </h2>
          <p>Real-time updates regarding your loan applications, credit approvals, and settlement receipts.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:var(--text-secondary); cursor:pointer;">
            <input type="checkbox" id="auto-refresh-toggle" checked />
            Live Auto-Refresh
          </label>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-notifications">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="glass-panel" style="padding: var(--space-4); margin-bottom: var(--space-6); display:flex; align-items:center; gap:12px;">
        <span style="font-size:0.85rem; color:var(--text-muted);">Search by Recipient / Account:</span>
        <input type="text" id="filter-recipient-input" class="form-control mono" style="max-width:320px;" placeholder="e.g. customer email or ID" />
        <button class="btn btn-secondary btn-sm" id="btn-apply-filter">Filter</button>
        <button class="btn btn-outline btn-sm" id="btn-clear-filter">Show All</button>
      </div>

      <!-- Notifications Feed Table -->
      <div class="glass-panel" style="padding: var(--space-6);">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Delivery Channel</th>
                <th>Recipient</th>
                <th>Reference ID</th>
                <th>Status</th>
                <th>Dispatched At</th>
              </tr>
            </thead>
            <tbody id="notifications-tbody">
              <tr><td colspan="6" style="text-align:center; padding:30px;"><span class="mono">Syncing notifications...</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    const loadNotifications = async () => {
      const tbody = container.querySelector('#notifications-tbody');
      if (!tbody) return;

      const recipient = container.querySelector('#filter-recipient-input')?.value?.trim();
      const endpoint = recipient
        ? CONFIG.API.NOTIFICATIONS.BY_RECIPIENT(recipient)
        : CONFIG.API.NOTIFICATIONS.BASE;

      try {
        const events = await ApiClient.get(endpoint);
        if (!events || events.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align:center; padding:40px;">
                <p>No account activity notifications recorded yet.</p>
                <span style="font-size:0.8rem; color:var(--text-muted);">Activity alerts will automatically arrive here as your loans and repayments are processed.</span>
              </td>
            </tr>
          `;
          return;
        }

        // Sort descending by timestamp
        const sorted = [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        tbody.innerHTML = sorted.map(ev => {
          let typeBadge = '<span class="badge badge-info">EVENT</span>';
          if (ev.eventType?.includes('APPROV') || ev.eventType?.includes('SUCCESS')) {
            typeBadge = `<span class="badge badge-success">${ev.eventType}</span>`;
          } else if (ev.eventType?.includes('REJECT') || ev.eventType?.includes('FAIL')) {
            typeBadge = `<span class="badge badge-danger">${ev.eventType}</span>`;
          } else {
            typeBadge = `<span class="badge badge-purple">${ev.eventType || 'NOTIFICATION'}</span>`;
          }

          const createdDate = ev.createdAt ? new Date(ev.createdAt).toLocaleString() : '—';

          return `
            <tr>
              <td>${typeBadge}</td>
              <td><span class="badge badge-muted">${ev.channel || 'IN_APP'}</span></td>
              <td><span class="mono" style="font-size:0.8rem; color:var(--text-primary);">${ev.recipient || 'Broadcast'}</span></td>
              <td><span class="mono" style="font-size:0.75rem; color:var(--text-muted);">${ev.aggregateId || '—'}</span></td>
              <td><span class="badge badge-success">${ev.status || 'PROCESSED'}</span></td>
              <td style="font-size:0.8rem;">${createdDate}</td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-rose); text-align:center; padding:20px;">Failed to load events: ${err.message}</td></tr>`;
      }
    };

    container.querySelector('#btn-refresh-notifications').onclick = loadNotifications;
    container.querySelector('#btn-apply-filter').onclick = loadNotifications;
    container.querySelector('#btn-clear-filter').onclick = () => {
      container.querySelector('#filter-recipient-input').value = '';
      loadNotifications();
    };

    // Auto-refresh interval
    clearInterval(NotificationView.pollTimer);
    NotificationView.pollTimer = setInterval(() => {
      const toggle = container.querySelector('#auto-refresh-toggle');
      if (toggle && toggle.checked && state.activeTab === 'notifications') {
        loadNotifications();
      }
    }, 5000);

    await loadNotifications();
  }
}
