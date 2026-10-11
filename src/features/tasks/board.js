/**
 * Kanban Board Page Controller
 *
 * Loads today's tasks through TaskService, renders them into the three
 * status columns, and handles drag-and-drop status changes, statistics,
 * and the task details / delete modal.
 *
 * Route:    board.html
 * Auth:     Signed-in users (guarded by auth-guard.js)
 */

const DRAG_HANDLE_HTML = `
    <span class="drag-handle" aria-label="اسحب المهمة">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
        </svg>
    </span>
`;

const COMPLETED_BADGE_HTML = `
    <span class="completed-check-badge" title="مكتملة">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </span>
`;

const DELETE_BUTTON_HTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
    <span>حذف المهمة</span>
`;

const INLINE_SPINNER_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-spinner" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
    </svg>
`;

const STATUS_DOT_CLASSES = {
    pending: "dot-pending",
    progress: "dot-progress",
    completed: "dot-completed",
};

function getColumnContainer(statusKey) {
    return document.getElementById(`cards-${statusKey}`);
}

/**
 * Builds the interactive Task Card DOM element with View Details Eye action.
 */
function createTaskCardElement(task, statusKey) {
    const card = document.createElement("div");
    const isCompleted = statusKey === "completed";

    card.className = `task-card ${isCompleted ? "card-is-completed" : ""}`;
    card.setAttribute("draggable", "true");
    card.setAttribute("data-id", task.id);
    card.setAttribute("data-status", statusKey);

    const categoryInfo = getCategoryInfo(task.category);
    const priorityInfo = getPriorityInfo(task.priority);
    const durationText = getDurationLabel(task.duration);

    card.innerHTML = `
        <div class="card-top">
            <span class="category-badge ${categoryInfo.className}">${escapeHtml(categoryInfo.label)}</span>
            <span class="priority-badge ${priorityInfo.className}">
                <span class="priority-dot" aria-hidden="true"></span>
                <span>${escapeHtml(priorityInfo.label)}</span>
            </span>
        </div>
        <h3 class="card-title">${escapeHtml(task.title)}</h3>
        ${task.description ? `<p class="card-desc">${escapeHtml(task.description)}</p>` : ""}
        <div class="card-bottom">
            <span class="duration-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${escapeHtml(durationText)}</span>
            </span>
            <div class="card-actions-group">
                <button type="button" class="btn-card-details" title="عرض تفاصيل المهمة" aria-label="عرض تفاصيل المهمة">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                ${isCompleted ? COMPLETED_BADGE_HTML : DRAG_HANDLE_HTML}
            </div>
        </div>
    `;

    // Click handler for View Details Eye action
    card.querySelector(".btn-card-details").addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        openTaskDetailsModal(task, card);
    });

    card.addEventListener("dragstart", (e) => {
        card.classList.add("is-dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
    });

    return card;
}

/**
 * Applies the visual state of a status to a card (completed styling and
 * drag-handle vs. check-badge action icon).
 */
function applyCardStatus(cardElement, statusKey) {
    cardElement.setAttribute("data-status", statusKey);

    const actionsGroup = cardElement.querySelector(".card-actions-group");
    const isCompleted = statusKey === "completed";
    cardElement.classList.toggle("card-is-completed", isCompleted);

    if (isCompleted) {
        const handle = actionsGroup?.querySelector(".drag-handle");
        if (handle) handle.outerHTML = COMPLETED_BADGE_HTML;
    } else {
        const checkBadge = actionsGroup?.querySelector(".completed-check-badge");
        if (checkBadge) checkBadge.outerHTML = DRAG_HANDLE_HTML;
    }
}

/**
 * Recalculates stats, counters, and completion percentage across all sections.
 */
function updateBoardStats() {
    const counts = {};
    Object.keys(STATUS_LABELS).forEach((statusKey) => {
        const container = getColumnContainer(statusKey);
        counts[statusKey] = container ? container.querySelectorAll(".task-card").length : 0;

        const counter = document.getElementById(`counter-${statusKey}`);
        if (counter) counter.textContent = counts[statusKey];

        const stat = document.getElementById(`stat-${statusKey}`);
        if (stat) stat.textContent = counts[statusKey];

        // Render empty state placeholder if list is empty
        checkEmptyPlaceholder(container, STATUS_LABELS[statusKey]);
    });

    const totalCount = counts.pending + counts.progress + counts.completed;

    const statTotal = document.getElementById("stat-total");
    if (statTotal) statTotal.textContent = totalCount;

    const statPill = document.getElementById("stat-progress-pill");
    if (statPill) {
        const percentage = totalCount > 0 ? Math.round((counts.completed / totalCount) * 100) : 0;
        statPill.innerHTML = `<span>${percentage}% إنجاز</span>`;
    }
}

/**
 * Shows a placeholder when a column has zero cards.
 */
function checkEmptyPlaceholder(container, label) {
    if (!container) return;

    const hasCards = container.querySelectorAll(".task-card").length > 0;
    let placeholder = container.querySelector(".empty-column-placeholder");

    if (!hasCards) {
        if (!placeholder) {
            placeholder = document.createElement("div");
            placeholder.className = "empty-column-placeholder";
            placeholder.textContent = `لا توجد مهام في قسم ${label}`;
            container.appendChild(placeholder);
        }
    } else if (placeholder) {
        placeholder.remove();
    }
}

/**
 * Reverts a task card to its previous column and state if server update fails.
 */
function revertCardToPreviousStatus(cardElement, previousStatus) {
    if (!cardElement || !previousStatus) return;

    applyCardStatus(cardElement, previousStatus);
    getColumnContainer(previousStatus)?.appendChild(cardElement);
    updateBoardStats();
}

/**
 * Persists a status change. Rolls the card back if the server does not confirm.
 */
function updateTaskStatus(taskId, statusKey, cardElement, previousStatus) {
    const newStatusLabel = STATUS_LABELS[statusKey] || statusKey;

    TaskService.updateStatus(taskId, statusKey)
        .then((data) => {
            if (isApiSuccess(data)) {
                showToast("تم تحديث الحالة", `تم نقل المهمة إلى "${newStatusLabel}" وتحديثها بنجاح.`, "success", 2000);
            } else {
                showToast("فشل التحديث", getApiErrorMessage(data, "لم يتم تأكيد العملية من السيرفر."), "error", 3500);
                revertCardToPreviousStatus(cardElement, previousStatus);
            }
        })
        .catch((error) => {
            console.error("Error updating task status:", error);
            showToast("خطأ في التحديث", getApiErrorMessage(error, "تعذر حفظ تغيير الحالة في السيرفر، يرجى التحقق من الاتصال."), "error");
            revertCardToPreviousStatus(cardElement, previousStatus);
        });
}

/**
 * Calculates the closest task card relative to mouse Y position for precise insertion among multiple cards.
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task-card:not(.is-dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function placeCardAtPointer(container, card, clientY) {
    const afterElement = getDragAfterElement(container, clientY);
    if (afterElement) {
        container.insertBefore(card, afterElement);
    } else {
        container.appendChild(card);
    }
}

/**
 * Initializes drag and drop listeners on column containers.
 */
function initDragAndDrop() {
    Object.keys(STATUS_LABELS).forEach((statusKey) => {
        const container = getColumnContainer(statusKey);
        if (!container) return;

        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            container.classList.add("drag-over");

            const draggingCard = document.querySelector(".task-card.is-dragging");
            if (draggingCard) placeCardAtPointer(container, draggingCard, e.clientY);
        });

        container.addEventListener("dragleave", (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove("drag-over");
            }
        });

        container.addEventListener("drop", (e) => {
            e.preventDefault();
            container.classList.remove("drag-over");

            const draggingCard = document.querySelector(".task-card.is-dragging");
            if (!draggingCard) return;

            const previousStatus = draggingCard.getAttribute("data-status");
            const taskId = draggingCard.getAttribute("data-id");

            applyCardStatus(draggingCard, statusKey);
            placeCardAtPointer(container, draggingCard, e.clientY);
            updateBoardStats();

            // Persist the new status in the database
            if (previousStatus !== statusKey && taskId) {
                updateTaskStatus(taskId, statusKey, draggingCard, previousStatus);
            }
        });
    });
}

let currentActiveModalTask = null;
let currentActiveModalCardElement = null;

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function resetDeleteButton(deleteBtn) {
    deleteBtn.disabled = false;
    deleteBtn.classList.remove("is-confirming");
    deleteBtn.innerHTML = DELETE_BUTTON_HTML;
}

/**
 * Opens the Task Details Modal populated with database fields.
 */
function openTaskDetailsModal(task, cardElement) {
    currentActiveModalTask = task;
    currentActiveModalCardElement = cardElement;

    const overlay = document.getElementById("task-details-modal-overlay");
    if (!overlay) return;

    const categoryInfo = getCategoryInfo(task.category);
    const priorityInfo = getPriorityInfo(task.priority);
    const statusKey = normalizeStatus(task.status);
    const statusLabel = STATUS_LABELS[statusKey];

    // 1. Populate Badges
    const headerBadges = document.getElementById("modal-header-badges");
    if (headerBadges) {
        headerBadges.innerHTML = `
            <span class="category-badge ${categoryInfo.className}">${escapeHtml(categoryInfo.label)}</span>
            <span class="priority-badge ${priorityInfo.className}">
                <span class="priority-dot" aria-hidden="true"></span>
                <span>${escapeHtml(priorityInfo.label)}</span>
            </span>
            <span class="modal-status-badge">
                <span class="column-dot column-dot-sm ${STATUS_DOT_CLASSES[statusKey]}" aria-hidden="true"></span>
                <span>${escapeHtml(statusLabel)}</span>
            </span>
        `;
    }

    // 2. Populate Title and Description
    setText("modal-task-title", task.title || "مهمة بدون عنوان");

    const descEl = document.getElementById("modal-task-description");
    if (descEl) {
        const hasDescription = Boolean(task.description && task.description.trim());
        descEl.textContent = hasDescription ? task.description : "لا يوجد وصف إضافي لهذه المهمة.";
        descEl.classList.toggle("is-empty", !hasDescription);
    }

    // 3. Populate Grid Fields
    setText("modal-task-status", statusLabel);
    setText("modal-task-category", categoryInfo.label);
    setText("modal-task-priority", priorityInfo.label);
    setText("modal-task-duration", getDurationLabel(task.duration));
    setText("modal-task-date", task.date || getTodayDateString());
    setText("modal-task-id", task.ID_task || task.id || "-");

    const deleteBtn = document.getElementById("modal-delete-btn");
    if (deleteBtn) resetDeleteButton(deleteBtn);

    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-modal-open");
}

/**
 * Closes the Task Details Modal.
 */
function closeTaskDetailsModal() {
    const overlay = document.getElementById("task-details-modal-overlay");
    if (!overlay) return;

    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-modal-open");
    currentActiveModalTask = null;
    currentActiveModalCardElement = null;
}

/**
 * Removes a card from the board with a short exit transition.
 */
function removeCardElement(cardElement) {
    if (!cardElement || !cardElement.parentNode) {
        updateBoardStats();
        return;
    }

    cardElement.classList.add("is-removing");
    setTimeout(() => {
        cardElement.remove();
        updateBoardStats();
    }, 200);
}

/**
 * Deletes the task shown in the modal. The first click asks for confirmation.
 */
function deleteTaskFromModal() {
    if (!currentActiveModalTask) return;

    const deleteBtn = document.getElementById("modal-delete-btn");
    if (!deleteBtn) return;

    // First click: prompt for confirmation
    if (!deleteBtn.classList.contains("is-confirming")) {
        deleteBtn.classList.add("is-confirming");
        deleteBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>تأكيد الحذف؟</span>
        `;
        return;
    }

    const taskToDelete = currentActiveModalTask;
    const cardElToDelete = currentActiveModalCardElement;
    const taskTitle = taskToDelete.title || "المهمة";

    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `${INLINE_SPINNER_SVG}<span>جاري الحذف...</span>`;

    TaskService.deleteTask(taskToDelete)
        .then((data) => {
            // Treat anything except an explicit error as success
            if (isApiSuccess(data) || !data || data.process !== "error") {
                removeCardElement(cardElToDelete);
                closeTaskDetailsModal();
                showToast("تم الحذف بنجاح", `تم حذف المهمة "${taskTitle}" بنجاح.`, "success", 2500);
            } else {
                showToast("فشل الحذف", getApiErrorMessage(data, "فشلت عملية حذف المهمة في السيرفر."), "error", 4000);
                resetDeleteButton(deleteBtn);
            }
        })
        .catch((error) => {
            console.error("Error deleting task:", error);
            showToast("خطأ في الحذف", getApiErrorMessage(error, "تعذر إتمام طلب الحذف، يرجى التحقق من اتصال السيرفر."), "error");
            resetDeleteButton(deleteBtn);
        });
}

/**
 * Initializes modal event listeners once on DOM ready.
 */
function initTaskDetailsModalListeners() {
    const overlay = document.getElementById("task-details-modal-overlay");

    document.getElementById("modal-close-btn")?.addEventListener("click", closeTaskDetailsModal);
    document.getElementById("modal-dismiss-btn")?.addEventListener("click", closeTaskDetailsModal);
    document.getElementById("modal-delete-btn")?.addEventListener("click", deleteTaskFromModal);

    overlay?.addEventListener("click", (e) => {
        if (e.target === overlay) closeTaskDetailsModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay?.classList.contains("is-active")) {
            closeTaskDetailsModal();
        }
    });
}

function renderTodayBadge() {
    setText("today-date-badge", `مهام اليوم: ${getTodayArabicString()}`);
}

/**
 * Fetches tasks and renders only today's tasks into their status columns.
 */
function loadTodayTasks() {
    const btn = document.getElementById("btn-fetch-tasks");
    const originalContent = btn ? btn.innerHTML : "";

    renderTodayBadge();

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `${INLINE_SPINNER_SVG}<span>جاري الجلب...</span>`;
    }

    TaskService.fetchTasks(getTodayDateString())
        .then((data) => {
            // n8n misconfiguration: Respond to Webhook returns the plain text "yes"
            if (typeof data === "string" && data.trim() === "yes") {
                showToast(
                    "إعداد n8n مطلوب",
                    "عقدة Respond to Webhook في n8n مضبوطة على إرجاع نص 'yes' بدلاً من بيانات المهام JSON.",
                    "error",
                    5000
                );
                return;
            }

            const todayTasks = parseTasksResponse(data).filter((task) => isTaskForToday(task.date));

            Object.keys(STATUS_LABELS).forEach((statusKey) => {
                const container = getColumnContainer(statusKey);
                if (container) container.innerHTML = "";
            });

            if (todayTasks.length === 0) {
                showToast("لا توجد مهام اليوم", "لم يتم العثور على أي مهام مسجلة لتاريخ اليوم.", "info");
                return;
            }

            todayTasks.forEach((task) => {
                const statusKey = normalizeStatus(task.status);
                getColumnContainer(statusKey)?.appendChild(createTaskCardElement(task, statusKey));
            });

            showToast("مهام اليوم", `تم تحميل ${todayTasks.length} مهمة لتاريخ اليوم بنجاح.`, "success");
        })
        .catch((error) => {
            console.error("Error fetching tasks:", error);
            showToast("خطأ في الاتصال", "تعذر جلب المهام من السيرفر، يرجى التأكد من تشغيل الـ Webhook في n8n.", "error");
        })
        .finally(() => {
            updateBoardStats();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        });
}

document.addEventListener("DOMContentLoaded", () => {
    // auth-guard.js handles the full session check; bail out early if signed out
    if (!AuthSession.getUser()) {
        window.location.href = ROUTES.auth;
        return;
    }

    renderTodayBadge();
    initDragAndDrop();
    initTaskDetailsModalListeners();
    document.getElementById("btn-fetch-tasks")?.addEventListener("click", loadTodayTasks);
    loadTodayTasks();
});
