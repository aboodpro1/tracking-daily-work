/**
 * Add Task Page Controller
 *
 * Validates the new-task form and submits it through TaskService.
 *
 * Route:    add-task.html
 * Auth:     Signed-in users (guarded by auth-guard.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".task-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        addTask();
    });
});

/**
 * Add Task Main Handler
 */
function addTask() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const titleInput = document.getElementById("task-title");
    const descInput = document.getElementById("task-description");
    const title = titleInput ? titleInput.value.trim() : "";
    const description = descInput ? descInput.value.trim() : "";

    if (!title) {
        showToast("حقل مطلوب", "يرجى كتابة عنوان المهمة قبل المتابعة.", "error");
        titleInput?.focus();
        return;
    }

    if (!description) {
        showToast("حقل مطلوب", "يرجى كتابة وصف المهمة قبل المتابعة.", "error");
        descInput?.focus();
        return;
    }

    const category = document.querySelector('input[name="task_category"]:checked')?.value || "";
    const priority = document.querySelector('input[name="task_priority"]:checked')?.value || "";
    const duration = document.querySelector('input[name="task_duration"]:checked')?.value || "";

    // 2. التحكم في زر الإرسال وتفعيل تأثير التحميل (Loading Effect)
    const submitBtn = document.querySelector(".submit-button");
    const btnText = submitBtn?.querySelector(".btn-text");

    if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = "جاري الإضافة...";
    }

    // 3. إرسال البيانات
    TaskService.createTask({ title, description, category, priority, duration })
        .then((data) => {
            if (isApiSuccess(data)) {
                showToast("تمت الإضافة بنجاح!", data.message || "تم حفظ المهمة الجديدة في قاعدة البيانات بنجاح.", "success", 2000);
                setTimeout(() => {
                    window.location.href = ROUTES.board;
                }, 1000);
            } else {
                console.error("Add Task Error Response:", data);
                showToast("فشلت الإضافة", getApiErrorMessage(data, "فشلت عملية إضافة المهمة في قاعدة البيانات."), "error", 4000);
            }
        })
        .catch((error) => {
            console.error("Add Task Network/Server Error:", error);
            showToast("فشل في الإرسال", getApiErrorMessage(error, "تعذر الاتصال بالسيرفر، تأكد من تشغيل الخدمة وصحة البيانات."), "error", 4000);
        })
        .finally(() => {
            // 4. إيقاف تأثير التحميل وإعادة الزر لحالته الأصلية
            if (submitBtn) {
                submitBtn.classList.remove("is-loading");
                submitBtn.disabled = false;
                if (btnText) btnText.textContent = "إضافة المهمة";
            }
        });
}
