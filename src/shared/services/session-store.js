/**
 * Session Store
 *
 * Client-side persistence for the auth token and the signed-in user.
 * The only module allowed to touch the `auth_*` localStorage keys.
 */

const AuthSession = {
    TOKEN_KEY: "auth_token",
    USER_KEY: "auth_user",

    setSession(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Saved user object (userId, name, email, role) or null
    getUser() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    getUserId() {
        const user = this.getUser() || {};
        return user.userId || user.id || "";
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    isAuthenticated() {
        return Boolean(this.getToken() && this.getUser());
    },
};
