/**
 * Application Configuration
 *
 * Single source of truth for backend endpoints and page routes.
 * Every feature reads from here instead of hard-coding URLs.
 *
 * Set API_MODE to "test" to hit the n8n editor endpoints (webhook-test).
 */

const API_BASE_URL = "https://n8n-production-c217.up.railway.app";
const API_MODE = "production"; // "production" | "test"

const API_WEBHOOK_PATH = API_MODE === "test" ? "webhook-test" : "webhook";

const API_ENDPOINTS = Object.freeze({
    auth: `${API_BASE_URL}/${API_WEBHOOK_PATH}/Auth-database`,
    tasksGet: `${API_BASE_URL}/${API_WEBHOOK_PATH}/Get-database`,
    tasksPost: `${API_BASE_URL}/${API_WEBHOOK_PATH}/post-database`,
});

const ROUTES = Object.freeze({
    landing: "../index.html",
    auth: "auth.html",
    addTask: "add-task.html",
    board: "board.html",
});
