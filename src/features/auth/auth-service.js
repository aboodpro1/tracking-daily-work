/**
 * Auth Service
 *
 * Network layer for authentication. Talks to the n8n `Auth-database` webhook.
 * No DOM access here — UI lives in auth-page.js and auth-guard.js.
 */

const AuthService = {
    signIn({ email, password, rememberMe }) {
        return ApiClient.post(API_ENDPOINTS.auth, {
            Get: "User Sign In",
            data: {
                Get: "User Sign In",
                email,
                password,
                rememberMe,
            },
        }).then(unwrapApiResponse);
    },

    signUp({ name, email, password, role }) {
        return ApiClient.post(API_ENDPOINTS.auth, {
            POST: "User Sign Up",
            data: {
                name,
                email,
                password,
                role,
                status: "Active",
                userId: "usr_" + Math.random().toString(36).slice(2, 11),
            },
        }).then(unwrapApiResponse);
    },

    verifySession({ token, email }) {
        return ApiClient.get(API_ENDPOINTS.auth, {
            Get: "Verify User Session",
            token,
            email,
        }).then(unwrapApiResponse);
    },
};
