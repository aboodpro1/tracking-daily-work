/**
 * Auth Page Controller
 *
 * UI for auth.html: tab switching, password toggles, and the
 * sign-in / sign-up form submissions (network calls go through AuthService).
 *
 * Route:    auth.html
 * Auth:     Public (auth-guard.js redirects signed-in users into the app)
 */

const EYE_OPEN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_CLOSED_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

document.addEventListener("DOMContentLoaded", () => {
    initAuthTabs();
    initPasswordToggles();
    initFormHandlers();
});

/**
 * Initializes the Sign-in vs Sign-up tab switcher
 */
function initAuthTabs() {
    const tabButtons = document.querySelectorAll(".auth-switch-btn");
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    const authAlert = document.getElementById("auth-alert");

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const isSignin = btn.getAttribute("data-tab") === "signin";

            tabButtons.forEach((b) => {
                b.classList.toggle("active", b === btn);
                b.setAttribute("aria-selected", String(b === btn));
            });

            // Hide any previous alert message
            if (authAlert) {
                authAlert.className = "auth-alert";
                authAlert.textContent = "";
            }

            signinForm?.classList.toggle("active-form", isSignin);
            signupForm?.classList.toggle("active-form", !isSignin);
        });
    });
}

/**
 * Enables password show/hide toggle functionality
 */
function initPasswordToggles() {
    document.querySelectorAll(".auth-password-toggle").forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const input = document.getElementById(toggle.getAttribute("data-target"));
            if (!input) return;

            const isPassword = input.getAttribute("type") === "password";
            input.setAttribute("type", isPassword ? "text" : "password");
            toggle.innerHTML = isPassword ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
        });
    });
}

/**
 * Initializes form submission listeners
 */
function initFormHandlers() {
    document.getElementById("signin-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        loginUser();
    });

    document.getElementById("signup-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        registerUser();
    });
}

/**
 * Puts a submit button into its loading state and returns a restore function.
 */
function setSubmitLoading(submitBtn, loadingText) {
    if (!submitBtn) return () => {};

    const originalContent = submitBtn.innerHTML;
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="btn-loading-content">
            <span>${loadingText}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="spin-icon" aria-hidden="true">
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.25"></circle>
                <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>
            </svg>
        </span>
    `;

    return () => {
        submitBtn.classList.remove("is-loading");
        submitBtn.removeAttribute("aria-busy");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    };
}

/**
 * User Sign-In Main Handler
 */
function loginUser() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const emailInput = document.getElementById("signin-email");
    const passwordInput = document.getElementById("signin-password");
    const rememberMeInput = document.getElementById("signin-remember");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

    if (!email) {
        showToast("حقل مطلوب", "يرجى إدخال البريد الإلكتروني أو اسم المستخدم.", "error");
        emailInput?.focus();
        return;
    }

    if (!password) {
        showToast("حقل مطلوب", "يرجى إدخال كلمة المرور قبل المتابعة.", "error");
        passwordInput?.focus();
        return;
    }

    // 2. تفعيل تأثير التحميل
    const restoreButton = setSubmitLoading(document.getElementById("btn-submit-signin"), "جاري تسجيل الدخول...");

    // 3. إرسال طلب تسجيل الدخول للسيرفر
    AuthService.signIn({ email, password, rememberMe })
        .then((res) => {
            if (res?.process === "done") {
                const token = res.token || "token_" + Date.now();
                const user = res.user || {
                    email,
                    name: res.name || email.split("@")[0],
                    role: res.role || "Member",
                };
                AuthSession.setSession(token, user);

                showToast("تم تسجيل الدخول بنجاح!", `مرحباً بك ${user.name}، جاري نقلك إلى لوحة المهام...`, "success", 2000);
                setTimeout(() => {
                    window.location.href = ROUTES.addTask;
                }, 1500);
            } else {
                const errorMsg = res?.message || "بيانات تسجيل الدخول غير صحيحة، يرجى المحاولة مرة أخرى.";
                showToast("فشل تسجيل الدخول", errorMsg, "error", 3500);
            }
        })
        .catch((error) => {
            console.error("Sign-in Error:", error);
            showToast("خطأ في الاتصال", "تعذر الاتصال بخادم المصادقة، يرجى التأكد من تشغيل الـ Webhook.", "error");
        })
        .finally(restoreButton);
}

/**
 * User Sign-Up Main Handler
 */
function registerUser() {
    // 1. جلب القيم والتحقق من الحقول الإجبارية
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");
    const termsInput = document.getElementById("signup-terms");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const role = document.querySelector('input[name="user_role"]:checked')?.value || "member";

    if (!name) {
        showToast("حقل مطلوب", "يرجى كتابة اسمك الكامل قبل المتابعة.", "error");
        nameInput?.focus();
        return;
    }

    if (!email || !email.includes("@")) {
        showToast("بريد إلكتروني غير صالح", "يرجى كتابة عنوان بريد إلكتروني صحيح.", "error");
        emailInput?.focus();
        return;
    }

    // التحقق من كلمة المرور (8 أحرف على الأقل)
    if (!password || password.length < 8) {
        showToast("كلمة المرور قصيرة", "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.", "error");
        passwordInput?.focus();
        return;
    }

    if (termsInput && !termsInput.checked) {
        showToast("تنبيه", "يرجى الموافقة على الشروط وسياسة الاستخدام للمتابعة.", "error");
        return;
    }

    // 2. تفعيل تأثير التحميل
    const restoreButton = setSubmitLoading(document.getElementById("btn-submit-signup"), "جاري إنشاء الحساب...");

    // 3. إرسال طلب إنشاء الحساب
    AuthService.signUp({ name, email, password, role })
        .then((res) => {
            if (res?.process === "done") {
                const token = res.token || "token_" + Date.now();
                const user = res.user || { name, email, role, status: "Active" };
                AuthSession.setSession(token, user);

                showToast("تم إنشاء الحساب بنجاح!", "مرحباً بك، تم تجهيز حسابك وجاري تحويلك للوحة المهام...", "success", 2000);
                setTimeout(() => {
                    window.location.href = ROUTES.addTask;
                }, 1500);
            } else {
                const errorMsg = res?.message || "تعذر إكمال إنشاء الحساب، يرجى المحاولة مرة أخرى.";
                showToast("فشل إنشاء الحساب", errorMsg, "error", 3500);
            }
        })
        .catch((error) => {
            console.error("Sign-up Error:", error);
            showToast("خطأ في الاتصال", "تعذر الاتصال بالسيرفر، يرجى التأكد من تشغيل الـ Webhook.", "error");
        })
        .finally(restoreButton);
}
