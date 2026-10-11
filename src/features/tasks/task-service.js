/**
 * Task Service
 *
 * Network layer for the tasks domain. Talks to the n8n `Get-database` and
 * `post-database` webhooks. No DOM access here — UI lives in add-task.js
 * and board.js.
 */

function getCurrentUserContext() {
    const user = AuthSession.getUser() || {};

    return {
        user,
        userId: AuthSession.getUserId(),
        userEmail: user.email || "",
    };
}

const TaskService = {
    /**
     * Fetches the signed-in user's tasks for the given date (YYYY-MM-DD).
     * Resolves with the raw response body; parse it with parseTasksResponse().
     */
    fetchTasks(date) {
        const { userId, userEmail } = getCurrentUserContext();

        return ApiClient.get(API_ENDPOINTS.tasksGet, {
            Get: "get_all_tasks",
            date,
            userId,
            "user ID": userId,
            userEmail,
        });
    },

    createTask({ title, description, category, priority, duration }) {
        const { user, userId } = getCurrentUserContext();

        return ApiClient.post(API_ENDPOINTS.tasksPost, {
            POST: "Add a new task",
            data: {
                title,
                description,
                category,
                priority,
                duration,
                status: STATUS_LABELS.pending,
                userEmail: user.email || "",
                userName: user.name || "",
                userId,
                "user ID": userId,
                userRole: user.role || "member",
            },
        });
    },

    updateStatus(taskId, statusKey) {
        const { userId } = getCurrentUserContext();

        return ApiClient.post(API_ENDPOINTS.tasksPost, {
            POST: "Update task status",
            taskId,
            id: taskId,
            status: STATUS_LABELS[statusKey] || statusKey,
            status_text: STATUS_NOTION_NAMES[statusKey] || statusKey,
            statusKey,
            userId,
            "user ID": userId,
            updated_at: new Date().toISOString(),
        });
    },

    deleteTask(task) {
        const { userId, userEmail } = getCurrentUserContext();

        const payload = {
            taskId: task.id,
            id: task.id,
            ID_task: task.ID_task || task.id,
            title: task.title || "",
            description: task.description || "",
            status: task.status || "",
            category: task.category || "",
            priority: task.priority || "",
            duration: task.duration || "",
            date: task.date || "",
            userId,
            "user ID": userId,
            userEmail,
        };

        return ApiClient.post(API_ENDPOINTS.tasksPost, {
            POST: "Delete a task",
            action: "delete",
            ...payload,
            data: payload,
        });
    },
};
