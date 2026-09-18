/**
 * Modal Dialog Manager
 */

export class Modal {
  static open(title, bodyHtml, footerButtons = []) {
    let overlay = document.getElementById('global-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const footerHtml = footerButtons.map((btn, index) => `
      <button class="btn ${btn.className || 'btn-secondary'}" id="modal-btn-${index}">
        ${btn.label}
      </button>
    `).join('');

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close-btn" id="modal-close-btn" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
        ${footerButtons.length ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    // Attach close listener
    const closeBtn = overlay.querySelector('#modal-close-btn');
    if (closeBtn) closeBtn.onclick = () => Modal.close();

    // Close on overlay click outside content
    overlay.onclick = (e) => {
      if (e.target === overlay) Modal.close();
    };

    // Attach button callbacks
    footerButtons.forEach((btn, index) => {
      const buttonEl = overlay.querySelector(`#modal-btn-${index}`);
      if (buttonEl && btn.onClick) {
        buttonEl.onclick = (e) => btn.onClick(e, overlay);
      }
    });

    // Animate open
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    return overlay;
  }

  static close() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}
