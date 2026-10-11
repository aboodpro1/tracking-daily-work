/**
 * Auth Guard & Navbar Profile
 *
 * Runs on every page that loads it:
 * - auth.html:            redirects already signed-in users into the app.
 * - protected app pages:  verifies the session on load/refresh, renders the
 *                         navbar user profile, and wires the logout action.
 */

const ROLE_LABELS = {
    admin: "مدير نظام",
    lead: "مشرف مهام",
    member: "عضو فريق",
};

// Matches both "/auth.html" and clean URLs ("/auth") served by some static hosts
function isAuthPage() {
    const page = window.location.pathname.split("/").pop().replace(/\.html$/, "");
    return page === ROUTES.auth.replace(/\.html$/, "");
}

/**
 * Renders the logged in user info in the navigation bar and dropdown
 */
function renderNavbarUserProfile() {
    const user = AuthSession.getUser();
    if (!user) return;

    const displayName = user.name || user.email?.split("@")[0] || "المستخدم";
    const email = user.email || "";
    const role = user.role || "Member";
    const translatedRole = ROLE_LABELS[String(role).toLowerCase()] || role;
    const initial = displayName.trim().charAt(0).toUpperCase() || "U";

    const fields = {
        "nav-user-name": displayName,
        "nav-user-role": translatedRole,
        "nav-user-avatar": initial,
        "dropdown-user-name": displayName,
        "dropdown-user-email": email,
        "dropdown-user-role": translatedRole,
        "dropdown-user-avatar": initial,
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    initUserDropdownMenu();
}

/**
 * Initializes the dropdown menu toggle and outside click dismiss
 */
function initUserDropdownMenu() {
    const trigger = document.getElementById("user-menu-trigger");
    const dropdown = document.getElementById("user-dropdown-card");

    if (!trigger || !dropdown || trigger.dataset.bound === "true") return;

    trigger.dataset.bound = "true";

    const setOpen = (isOpen) => {
        dropdown.classList.toggle("show", isOpen);
        trigger.classList.toggle("is-open", isOpen);
        trigger.setAttribute("aria-expanded", String(isOpen));
    };

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(!dropdown.classList.contains("show"));
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
            setOpen(false);
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") setOpen(false);
    });
}

/**
 * Verify User Session on Page Refresh
 * Verifies if user exists and confirms their role and permissions.
 */
async function verifySessionOnRefresh() {
    const token = AuthSession.getToken();
    const localUser = AuthSession.getUser();

    // 1. فحص وجود التوكن محلياً
    if (!token || !localUser) {
        window.location.replace(ROUTES.auth);
        return false;
    }

    // 2. تحديث واجهة المستخدم فوراً بالبيانات المحفوظة
    renderNavbarUserProfile();

    // 3. التحقق مع الـ Webhook للتأكد من وجود المستخدم ونوعه
    try {
        const res = await AuthService.verifySession({ token, email: localUser.email });

        if (res && (res.process === "done" || res.valid === true || res.status === "success")) {
            // تحديث بيانات وصلاحية المستخدم في حال تم تعديلها في قاعدة البيانات
            if (res.user) {
                AuthSession.setUser(res.user);
                renderNavbarUserProfile();
            }
            return true;
        }

        if (res && (res.valid === false || res.process === "error")) {
            // في حال تم حذف أو تعطيل الحساب من قاعدة البيانات
            logoutUser("انتهت صلاحية الجلسة أو تم تعطيل الحساب، يرجى تسجيل الدخول مجدداً.");
            return false;
        }
    } catch (error) {
        // في حال تعذر الوصول للـ Webhook مؤقتاً، الاستمرار بالبيانات المحلية لضمان تجربة مستخدم سلسة
        console.warn("Session verification check warning (webhook unreachable):", error);
    }

    return true;
}

/**
 * Log Out Current User
 */
function logoutUser(message = "تم تسجيل الخروج بنجاح.") {
    AuthSession.clearSession();
    showToast("تسجيل الخروج", message, "success", 1500);

    setTimeout(() => {
        window.location.href = ROUTES.auth;
    }, 1000);
}

/**
 * Page Auth Guard Auto-initializer
 */
document.addEventListener("DOMContentLoaded", () => {
    if (isAuthPage()) {
        // إذا كان مسجل دخول مسبقاً وتوجه لصفحة auth، نحوله للوحة الرئيسية
        if (AuthSession.isAuthenticated()) {
            window.location.replace(ROUTES.addTask);
        }
        return;
    }

    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
        btn.addEventListener("click", () => logoutUser());
    });

    // فحص الجلسة عند كل تحميل أو ريفريش في كل صفحات الموقع
    verifySessionOnRefresh();
});
