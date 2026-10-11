/**
 * Task Mappers
 *
 * Pure data helpers for the tasks domain: date matching, status/category/
 * priority/duration normalization, and parsing of the varied n8n/Notion
 * response shapes into a single task model. No DOM or network access.
 */

const STATUS_LABELS = Object.freeze({
    pending: "قيد الانتظار",
    progress: "قيد التنفيذ",
    completed: "مكتملة",
});

const STATUS_NOTION_NAMES = Object.freeze({
    pending: "Not started",
    progress: "In progress",
    completed: "Done",
});

/**
 * Formats today's date in YYYY-MM-DD format for comparisons and API parameters.
 */
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Formats today's date in Arabic readable format for UI display.
 */
function getTodayArabicString() {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    try {
        return new Intl.DateTimeFormat("ar-EG", options).format(new Date());
    } catch {
        return getTodayDateString();
    }
}

/**
 * Checks if a given date string or object matches today's date.
 * If task has no date specified, it defaults to true to avoid hiding newly added tasks.
 */
function isTaskForToday(dateInput) {
    if (!dateInput) return true;

    try {
        let dateStr = dateInput;
        if (typeof dateInput === "object" && dateInput !== null) {
            dateStr = dateInput.start || dateInput.date || "";
        }

        if (!dateStr) return true;

        const todayStr = getTodayDateString();

        // Check if string begins with YYYY-MM-DD
        if (typeof dateStr === "string" && dateStr.startsWith(todayStr)) {
            return true;
        }

        const taskDate = new Date(dateStr);
        if (isNaN(taskDate.getTime())) {
            return true;
        }

        const today = new Date();
        return (
            taskDate.getFullYear() === today.getFullYear() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getDate() === today.getDate()
        );
    } catch {
        return true;
    }
}

/**
 * Maps raw Notion or custom status string to one of the 3 board sections.
 * Notion status options: "Not started", "In progress", "Done".
 */
function normalizeStatus(statusRaw) {
    if (!statusRaw) return "pending";

    const normalized = String(statusRaw).trim().toLowerCase();

    // Map In Progress statuses
    if (
        normalized === "in progress" ||
        normalized === "in_progress" ||
        normalized === "قيد التنفيذ" ||
        normalized === "doing" ||
        normalized === "جارية"
    ) {
        return "progress";
    }

    // Map Done / Complete statuses
    if (
        normalized === "done" ||
        normalized === "complete" ||
        normalized === "completed" ||
        normalized === "مكتملة" ||
        normalized === "مكتمل" ||
        normalized === "تم" ||
        normalized === "منجز"
    ) {
        return "completed";
    }

    // Default to pending for "Not started", "To-do", "قيد الانتظار" or unmapped
    return "pending";
}

/**
 * Resolves category display label and CSS badge styling.
 */
function getCategoryInfo(categoryRaw) {
    const val = String(categoryRaw || "").toLowerCase().trim();

    if (val === "religious" || val === "دينية") {
        return { label: "دينية", className: "cat-religious" };
    }
    if (val === "body" || val === "جسم" || val === "بدنية") {
        return { label: "جسم", className: "cat-body" };
    }
    if (val === "work" || val === "شغل" || val === "عمل") {
        return { label: "شغل", className: "cat-work" };
    }
    if (val === "study" || val === "دراسة" || val === "تعليم") {
        return { label: "دراسة", className: "cat-study" };
    }

    return { label: categoryRaw || "عامة", className: "cat-work" };
}

/**
 * Resolves priority display label and badge styling.
 */
function getPriorityInfo(priorityRaw) {
    const val = String(priorityRaw || "").toLowerCase().trim();

    if (val === "important" || val === "مهمة" || val === "high" || val === "urgent") {
        return { label: "مهمة", className: "priority-important" };
    }

    return { label: "عادية", className: "priority-normal" };
}

/**
 * Resolves duration display text.
 */
function getDurationLabel(durationRaw) {
    const val = String(durationRaw || "").toLowerCase().trim();

    if (val === "under_hour" || val === "أقل من ساعة") return "أقل من ساعة";
    if (val === "one_hour" || val === "ساعة") return "ساعة واحدة";
    if (val === "two_hours" || val === "ساعتان") return "ساعتان";
    if (!durationRaw) return "غير محدد";

    return durationRaw;
}

/**
 * Extracts a normalized array of task objects from varied webhook/n8n/Notion responses.
 * Handles:
 * 1. n8n direct property outputs: property_العنوان, property_الوصف, property_الحالة, property_التصنيف, property_الأهمية, property_الوقت_المتوقع, property_date
 * 2. Full Notion API Page format: properties.Title.title, properties.Status.status, etc.
 * 3. Standard flattened object arrays.
 */
function parseTasksResponse(responseData) {
    if (!responseData) return [];

    let rawList = [];

    // Parse string response if needed
    if (typeof responseData === "string") {
        try {
            responseData = JSON.parse(responseData);
        } catch {
            return [];
        }
    }

    if (Array.isArray(responseData)) {
        rawList = responseData;
    } else if (Array.isArray(responseData.results)) {
        rawList = responseData.results;
    } else if (Array.isArray(responseData.data)) {
        rawList = responseData.data;
    } else if (Array.isArray(responseData.tasks)) {
        rawList = responseData.tasks;
    } else if (Array.isArray(responseData.items)) {
        rawList = responseData.items;
    } else if (typeof responseData === "object" && responseData !== null) {
        // Check if single item with properties
        if (responseData.id || responseData.name || responseData.property_العنوان || responseData.properties) {
            rawList = [responseData];
        }
    }

    return rawList.map((item, index) => {
        const props = item.properties || item.data || item;

        // 1. Extract Title (supports n8n property_العنوان, name, Title, title)
        let title =
            props.property_العنوان ||
            item.property_العنوان ||
            item.name ||
            item.title ||
            item.task_title ||
            props.name ||
            "";

        if (!title && props.Title?.title?.[0]?.plain_text) {
            title = props.Title.title[0].plain_text;
        } else if (!title && props["العنوان"]?.title?.[0]?.plain_text) {
            title = props["العنوان"].title[0].plain_text;
        } else if (!title && props["عنوان المهمة"]?.title?.[0]?.plain_text) {
            title = props["عنوان المهمة"].title[0].plain_text;
        } else if (!title && props.title?.title?.[0]?.plain_text) {
            title = props.title.title[0].plain_text;
        } else if (!title && typeof props.title === "string") {
            title = props.title;
        }

        // 2. Extract Description (supports n8n property_الوصف, description, desc)
        let description =
            props.property_الوصف ||
            item.property_الوصف ||
            item.description ||
            item.desc ||
            item.task_description ||
            props.description ||
            "";

        if (!description && props.Description?.rich_text?.[0]?.plain_text) {
            description = props.Description.rich_text[0].plain_text;
        } else if (!description && props["الوصف"]?.rich_text?.[0]?.plain_text) {
            description = props["الوصف"].rich_text[0].plain_text;
        } else if (!description && props["وصف المهمة"]?.rich_text?.[0]?.plain_text) {
            description = props["وصف المهمة"].rich_text[0].plain_text;
        }

        // 3. Extract Status (supports n8n property_الحالة, property_text, status)
        let status =
            props.property_الحالة ||
            item.property_الحالة ||
            props.property_text ||
            item.property_text ||
            item.status ||
            item.state ||
            props.status ||
            "";

        if (!status && props.Status?.status?.name) {
            status = props.Status.status.name;
        } else if (!status && props.Status?.select?.name) {
            status = props.Status.select.name;
        } else if (!status && props["الحالة"]?.select?.name) {
            status = props["الحالة"].select.name;
        } else if (!status && props["الحالة"]?.status?.name) {
            status = props["الحالة"].status.name;
        }

        // 4. Extract Category (supports n8n property_التصنيف, category)
        let category =
            props.property_التصنيف ||
            item.property_التصنيف ||
            item.category ||
            item.task_category ||
            props.category ||
            "";

        if (!category && props.Category?.select?.name) {
            category = props.Category.select.name;
        } else if (!category && props["التصنيف"]?.select?.name) {
            category = props["التصنيف"].select.name;
        }

        // 5. Extract Priority (supports n8n property_الأهمية, priority)
        let priority =
            props.property_الأهمية ||
            item.property_الأهمية ||
            item.priority ||
            item.task_priority ||
            props.priority ||
            "";

        if (!priority && props.Priority?.select?.name) {
            priority = props.Priority.select.name;
        } else if (!priority && props["الأهمية"]?.select?.name) {
            priority = props["الأهمية"].select.name;
        }

        // 6. Extract Duration (supports n8n property_الوقت_المتوقع, duration)
        let duration =
            props.property_الوقت_المتوقع ||
            item.property_الوقت_المتوقع ||
            item.duration ||
            item.task_duration ||
            props.duration ||
            "";

        if (!duration && props.Duration?.select?.name) {
            duration = props.Duration.select.name;
        } else if (!duration && props["الوقت المتوقع"]?.select?.name) {
            duration = props["الوقت المتوقع"].select.name;
        }

        // 7. Extract Date (supports n8n property_date.start, Date, created_time)
        let date =
            props.property_date?.start ||
            item.property_date?.start ||
            props.property_date ||
            item.property_date ||
            item.date ||
            item.created_time ||
            item.created_at ||
            "";

        if (!date && props.Date?.date?.start) {
            date = props.Date.date.start;
        } else if (!date && props["التاريخ"]?.date?.start) {
            date = props["التاريخ"].date.start;
        } else if (!date && props["تاريخ"]?.date?.start) {
            date = props["تاريخ"].date.start;
        } else if (!date && item.created_time) {
            date = item.created_time;
        }

        const id = item.property_id_task || item.id || `task-${index}-${Date.now()}`;

        return {
            id,
            ID_task: item.property_id_task || item.ID_task || item.property_ID_task || id,
            title: title || "مهمة بدون عنوان",
            description,
            status,
            category,
            priority,
            duration,
            date,
            userId: item.userId || item["user ID"] || item.user_id || "",
            userEmail: item.userEmail || item.email || "",
            rawItem: item,
        };
    });
}
