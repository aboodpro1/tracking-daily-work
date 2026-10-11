/**
 * API Client
 *
 * Thin wrapper around axios used by every feature service.
 * Resolves with the response body; rejects with the original axios error
 * so callers can still read `error.response.data`.
 */

const ApiClient = {
    get(url, params = {}) {
        return axios.get(url, { params }).then((response) => response.data);
    },

    post(url, body = {}) {
        return axios.post(url, body).then((response) => response.data);
    },
};

/**
 * n8n sometimes wraps a single response object in an array.
 */
function unwrapApiResponse(data) {
    return Array.isArray(data) ? data[0] : data;
}

/**
 * Accepts every success shape returned by the n8n workflows.
 */
function isApiSuccess(data) {
    return Boolean(data && (data.success === true || data.process === "done" || data.status === "success"));
}

/**
 * Extracts a readable error message from a failed response or axios error.
 */
function getApiErrorMessage(source, fallback) {
    const data = source?.response?.data ?? source;
    return data?.message || data?.error?.message || fallback;
}
