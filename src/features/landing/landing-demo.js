/**
 * Landing Page Interactive Demo
 *
 * Drives the mock Kanban boards on the landing page (hero preview and the
 * showcase board): card moves, drag and drop, category filters, and metrics.
 * Buttons declare their action through data attributes instead of inline
 * onclick handlers:
 *   data-action="move-hero-card" | "transfer-card"
 *   data-card-id="<card id>"  data-target="<column>"
 *
 * Route:    /index.html (landing, project root)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Set dynamic date in Arabic
    const dateBadge = document.getElementById('hero-mock-date');
    if (dateBadge) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        try {
            dateBadge.textContent = 'اليوم: ' + now.toLocaleDateString('ar-EG', options);
        } catch (e) {
            dateBadge.textContent = 'اليوم: متابعة مباشرة';
        }
    }

    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    initDemoActions();
    initDemoDragAndDrop();
    initCategoryFilters();
    updateHeroMetrics();
    updateAllMetrics();
});

// Delegated click handler for demo card buttons (they are re-rendered on every move)
function initDemoActions() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const { action, cardId, target } = btn.dataset;
        if (action === 'move-hero-card') moveHeroCard(cardId, target);
        if (action === 'transfer-card') transferCard(cardId, target);
    });
}

// Hero Mini Card Move
function moveHeroCard(cardId, targetCol) {
    const card = document.querySelector(`.mini-task-card[data-id="${cardId}"]`);
    const targetList = document.getElementById(`hero-list-${targetCol}`);
    if (!card || !targetList) return;

    targetList.appendChild(card);

    // Adjust card classes and actions
    const metaWrap = card.querySelector('.mini-card-meta');
    if (targetCol === 'pending') {
        card.classList.remove('is-active-task', 'is-done-task');
        metaWrap.innerHTML = `
            <span class="meta-time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> أقل من ساعة</span>
            <button type="button" class="mini-card-move-btn" data-action="move-hero-card" data-card-id="${cardId}" data-target="progress" title="نقل إلى قيد التنفيذ">نقل للبدء ←</button>
        `;
    } else if (targetCol === 'progress') {
        card.classList.add('is-active-task');
        card.classList.remove('is-done-task');
        metaWrap.innerHTML = `
            <span class="meta-time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> قيد التنفيذ</span>
            <button type="button" class="mini-card-move-btn btn-complete" data-action="move-hero-card" data-card-id="${cardId}" data-target="completed" title="إكمال المهمة">إكمال ✓</button>
        `;
    } else if (targetCol === 'completed') {
        card.classList.remove('is-active-task');
        card.classList.add('is-done-task');
        metaWrap.innerHTML = `
            <span class="meta-time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> منجزة</span>
            <span class="badge-done-mark">تم بنجاح ✓</span>
        `;
    }

    updateHeroMetrics();
}

function updateHeroMetrics() {
    const pCount = document.querySelectorAll('#hero-list-pending .mini-task-card').length;
    const prCount = document.querySelectorAll('#hero-list-progress .mini-task-card').length;
    const cCount = document.querySelectorAll('#hero-list-completed .mini-task-card').length;
    const total = pCount + prCount + cCount;

    const pendingEl = document.getElementById('hero-cnt-pending');
    const progressEl = document.getElementById('hero-cnt-progress');
    const completedEl = document.getElementById('hero-cnt-completed');
    const totalEl = document.getElementById('hero-total-tasks');
    const completedTotalEl = document.getElementById('hero-completed-tasks');
    const fillEl = document.getElementById('hero-progress-fill');
    const percentEl = document.getElementById('hero-progress-percent');

    if (pendingEl) pendingEl.textContent = pCount;
    if (progressEl) progressEl.textContent = prCount;
    if (completedEl) completedEl.textContent = cCount;
    if (totalEl) totalEl.textContent = total;
    if (completedTotalEl) completedTotalEl.textContent = cCount;

    const pct = total > 0 ? Math.round((cCount / total) * 100) : 0;
    if (fillEl) fillEl.style.width = pct + '%';
    if (percentEl) percentEl.textContent = pct + '%';
}

// Showcase Kanban Transfer
function transferCard(cardId, targetStatus) {
    const card = document.querySelector(`.demo-task-card[data-id="${cardId}"]`);
    const dropzone = document.getElementById(`zone-${targetStatus}`);
    if (!card || !dropzone) return;

    dropzone.appendChild(card);
    applyCardStatusStyles(card, targetStatus);
    updateAllMetrics();
}

function applyCardStatusStyles(card, status) {
    const cardId = card.getAttribute('data-id');
    const foot = card.querySelector('.demo-card-foot');
    const cat = card.getAttribute('data-cat');

    card.classList.remove('is-active-flow', 'is-completed-flow');

    let timeText = 'ساعة';
    if (cardId === 'c1') timeText = 'أقل من ساعة';
    if (cardId === 'c3') timeText = 'ساعتان';

    if (status === 'pending') {
        foot.innerHTML = `
            <span class="demo-time-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${timeText}
            </span>
            <button type="button" class="demo-action-btn" data-action="transfer-card" data-card-id="${cardId}" data-target="progress" title="بدء المهمة">بدء التنفيذ ←</button>
        `;
    } else if (status === 'progress') {
        card.classList.add('is-active-flow');
        foot.innerHTML = `
            <span class="demo-time-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${timeText}
            </span>
            <div class="demo-btn-group">
                <button type="button" class="demo-action-btn btn-back" data-action="transfer-card" data-card-id="${cardId}" data-target="pending" title="إرجاع للانتظار">→ انتظار</button>
                <button type="button" class="demo-action-btn btn-success" data-action="transfer-card" data-card-id="${cardId}" data-target="completed" title="إتمام المهمة">إتمام ✓</button>
            </div>
        `;
    } else if (status === 'completed') {
        card.classList.add('is-completed-flow');
        foot.innerHTML = `
            <span class="demo-time-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${timeText}
            </span>
            <button type="button" class="demo-action-btn btn-back" data-action="transfer-card" data-card-id="${cardId}" data-target="progress" title="إعادة فتح المهمة">إعادة فتح ←</button>
        `;
    }
}

function updateAllMetrics() {
    const p = document.querySelectorAll('#zone-pending .demo-task-card').length;
    const pr = document.querySelectorAll('#zone-progress .demo-task-card').length;
    const c = document.querySelectorAll('#zone-completed .demo-task-card').length;
    const total = p + pr + c;

    // Badges in columns
    const badgeP = document.getElementById('demo-count-pending');
    const badgePr = document.getElementById('demo-count-progress');
    const badgeC = document.getElementById('demo-count-completed');
    if (badgeP) badgeP.textContent = p;
    if (badgePr) badgePr.textContent = pr;
    if (badgeC) badgeC.textContent = c;

    // Progress section metrics
    const metricTotal = document.getElementById('demo-metric-total');
    const metricP = document.getElementById('demo-metric-pending');
    const metricPr = document.getElementById('demo-metric-progress');
    const metricC = document.getElementById('demo-metric-completed');
    const progressPercentVal = document.getElementById('demo-progress-percent-val');
    const circularFill = document.getElementById('demo-circular-fill');

    if (metricTotal) metricTotal.textContent = total;
    if (metricP) metricP.textContent = p;
    if (metricPr) metricPr.textContent = pr;
    if (metricC) metricC.textContent = c;

    const pct = total > 0 ? Math.round((c / total) * 100) : 0;
    if (progressPercentVal) progressPercentVal.textContent = pct + '%';
    if (circularFill) {
        circularFill.setAttribute('stroke-dasharray', `${pct}, 100`);
    }
}

// Drag & Drop Implementation
function initDemoDragAndDrop() {
    const cards = document.querySelectorAll('.demo-task-card');
    const zones = document.querySelectorAll('.demo-col-dropzone');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
        });
    });

    zones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-hover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-hover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-hover');
            const cardId = e.dataTransfer.getData('text/plain');
            const card = document.querySelector(`.demo-task-card[data-id="${cardId}"]`);
            if (card) {
                zone.appendChild(card);
                const status = zone.closest('.kanban-demo-column').getAttribute('data-status');
                applyCardStatusStyles(card, status);
                updateAllMetrics();
            }
        });
    });
}

// Category Filter for Showcase
function initCategoryFilters() {
    const filterBtns = document.querySelectorAll('.cat-filter-btn');
    const cards = document.querySelectorAll('.demo-task-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.getAttribute('data-filter');
            cards.forEach(card => {
                if (cat === 'all' || card.getAttribute('data-cat') === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}
