/**
 * Toast Notification
 *
 * Displays feedback notifications with enter/exit animations.
 * Title and message are rendered as text, never as HTML.
 *
 * @param {string} title
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration  Auto-hide delay in ms
 */

const TOAST_ICONS = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="20 6 9 17 4 12"></polyline>
           </svg>`,
    alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <circle cx="12" cy="12" r="10"></circle>
             <line x1="12" y1="8" x2="12" y2="12"></line>
             <line x1="12" y1="16" x2="12.01" y2="16"></line>
           </svg>`,
};

function showToast(title, message, type = "success", duration = 3000) {
    const container = document.getElementById("toast-container") || document.body;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-icon-box" aria-hidden="true">
            ${type === "success" ? TOAST_ICONS.success : TOAST_ICONS.alert}
        </div>
        <div class="toast-body">
            <div class="toast-title"></div>
            <div class="toast-message"></div>
        </div>
        <button type="button" class="toast-close" aria-label="إغلاق الإشعار">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-message").textContent = message;

    // زر الإغلاق اليدوي
    toast.querySelector(".toast-close").addEventListener("click", () => removeToast());

    container.appendChild(toast);

    // إخفاء تلقائي بعد انقضاء الوقت المحدد
    const autoHide = setTimeout(removeToast, duration);

    function removeToast() {
        clearTimeout(autoHide);
        toast.classList.add("toast-hiding");
        setTimeout(() => toast.remove(), 300);
    }
}
