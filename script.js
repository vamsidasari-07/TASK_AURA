
/* =========================================
   FOCUSFLOW — PRODUCTIVITY APP
========================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* HTML elements */
const themeBtn = $("#themeBtn");
const themeIcon = $("#themeIcon");
const themeLabel = $("#themeLabel");

const greeting = $("#greeting");
const todayDate = $("#todayDate");

const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const taskTime = $("#taskTime");
const taskCategory = $("#taskCategory");
const taskPriority = $("#taskPriority");

const taskList = $("#taskList");
const taskCount = $("#taskCount");
const emptyMessage = $("#emptyMessage");
const emptyTitle = $("#emptyTitle");
const emptyText = $("#emptyText");

const searchInput = $("#searchInput");
const filterButtons = $$(".filter-btn");

const totalCount = $("#totalCount");
const pendingCount = $("#pendingCount");
const completedCount = $("#completedCount");

const progressText = $("#progressText");
const progressBar = $("#progressBar");
const progressTrack = $("#progressTrack");
const progressMessage = $("#progressMessage");

const clearBtn = $("#clearBtn");
const clearCompletedBtn = $("#clearCompletedBtn");
const exportBtn = $("#exportBtn");

const quote = $("#quote");
const quoteAuthor = $("#quoteAuthor");
const newQuoteBtn = $("#newQuoteBtn");


/* =========================================
   STORAGE
========================================= */

function getSavedValue(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function saveValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn("Browser storage is unavailable.");
    }
}

function loadTasks() {
    try {
        const data = JSON.parse(
            getSavedValue("focusFlowTasks", "[]")
        );

        if (!Array.isArray(data)) return [];

        return data
            .filter(task =>
                task &&
                typeof task.text === "string" &&
                typeof task.id === "string"
            )
            .map(task => ({
                id: task.id,
                text: task.text,
                time: typeof task.time === "string"
                    ? task.time : "",
                category: typeof task.category === "string"
                    ? task.category : "Personal",
                priority: ["High", "Normal", "Low"].includes(task.priority)
                    ? task.priority : "Normal",
                completed: task.completed === true,
                createdAt: typeof task.createdAt === "number"
                    ? task.createdAt : Date.now()
            }));
    } catch (error) {
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";
let lastQuoteIndex = -1;

function saveTasks() {
    saveValue("focusFlowTasks", JSON.stringify(tasks));
}


/* =========================================
   LIGHT / DARK MODE
========================================= */

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    const isDark = selectedTheme === "dark";

    // This selector matches the CSS exactly.
    document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
    );

    themeIcon.textContent = isDark ? "☀" : "☾";
    themeLabel.textContent = isDark ? "Light" : "Dark";

    themeBtn.setAttribute("aria-pressed", String(isDark));
    themeBtn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    const themeColor = $('meta[name="theme-color"]');

    if (themeColor) {
        themeColor.setAttribute(
            "content",
            isDark ? "#101321" : "#eef2ff"
        );
    }

    saveValue("focusFlowTheme", selectedTheme);
}

// Load the saved theme when the app opens.
applyTheme(getSavedValue("focusFlowTheme", "light"));

// Toggle theme on button click.
themeBtn.addEventListener("click", function () {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    applyTheme(currentTheme === "dark" ? "light" : "dark");
});


/* =========================================
   DATE AND GREETING
========================================= */

function updateWelcome() {
    const now = new Date();
    const hour = now.getHours();

    let message = "Good evening";

    if (hour < 12) {
        message = "Good morning";
    } else if (hour < 17) {
        message = "Good afternoon";
    }

    greeting.textContent = message + " — ready to focus?";

    todayDate.textContent = now.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* =========================================
   TASK FILTERS
========================================= */

function updateFilterButtons() {
    filterButtons.forEach(button => {
        const active = button.dataset.filter === currentFilter;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;
        updateFilterButtons();
        renderTasks();
    });
});

// Live task search.
searchInput.addEventListener("input", renderTasks);


/* =========================================
   ADD TASK
========================================= */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        taskInput.focus();
        return;
    }

    const newTask = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2, 9),
        text: text,
        time: taskTime.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        completed: false,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);
    saveTasks();

    currentFilter = "all";
    searchInput.value = "";

    updateFilterButtons();
    renderTasks();

    taskForm.reset();
    taskInput.focus();
});


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(value) {
    if (!value) return "";

    const parts = value.split(":");

    if (parts.length !== 2) return value;

    const date = new Date();
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

    return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });
}


/* =========================================
   CREATE SAFE ELEMENTS
========================================= */

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createTaskElement(task) {
    const item = createElement("li", "task-item");

    if (task.completed) {
        item.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Complete task");

    checkbox.addEventListener("change", function () {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    });

    // Task title and metadata
    const content = createElement("div", "task-content");
    const title = createElement("div", "task-title", task.text);

    content.appendChild(title);

    const meta = createElement("div", "task-meta");

    meta.appendChild(
        createElement("span", "task-category", task.category)
    );

    const priorityClass = task.priority.toLowerCase();

    meta.appendChild(
        createElement(
            "span",
            "priority-badge " + priorityClass,
            task.priority + " priority"
        )
    );

    if (task.time) {
        meta.appendChild(
            createElement(
                "span",
                "task-deadline",
                "◷ " + formatTime(task.time)
            )
        );
    }

    content.appendChild(meta);

    // Action buttons
    const actions = createElement("div", "task-actions");

    const editBtn = createElement("button", "task-action", "✎");
    editBtn.type = "button";
    editBtn.title = "Edit task";
    editBtn.setAttribute("aria-label", "Edit task");

    editBtn.addEventListener("click", function () {
        const newText = prompt("Edit your task:", task.text);

        if (newText === null) return;

        if (!newText.trim()) {
            alert("Task name cannot be empty.");
            return;
        }

        task.text = newText.trim();
        saveTasks();
        renderTasks();
    });

    const deleteBtn = createElement("button", "task-action delete", "×");
    deleteBtn.type = "button";
    deleteBtn.title = "Delete task";
    deleteBtn.setAttribute("aria-label", "Delete task");

    deleteBtn.addEventListener("click", function () {
        if (!confirm("Delete this task?")) return;

        tasks = tasks.filter(item => item.id !== task.id);

        saveTasks();
        renderTasks();
    });

    actions.append(editBtn, deleteBtn);
    item.append(checkbox, content, actions);

    return item;
}


/* =========================================
   FILTER TASKS
========================================= */

function getVisibleTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    return tasks.filter(task => {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const searchableText = [
            task.text,
            task.category,
            task.priority
        ].join(" ").toLowerCase();

        return matchesFilter &&
            searchableText.includes(searchTerm);
    });
}


/* =========================================
   STATISTICS AND PROGRESS
========================================= */

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;
    taskCount.textContent = total;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressText.textContent = percentage + "% completed";
    progressBar.style.width = percentage + "%";

    progressTrack.setAttribute(
        "aria-valuenow",
        String(percentage)
    );

    if (total === 0) {
        progressMessage.textContent =
            "Your next accomplishment starts here.";
    } else if (percentage === 100) {
        progressMessage.textContent =
            "Everything is complete. You did amazing! ✨";
    } else {
        progressMessage.textContent =
            `${completed} of ${total} tasks complete. Keep going!`;
    }
}


/* =========================================
   EMPTY STATE AND RENDERING
========================================= */

function updateEmptyState(visibleTasks) {
    const hasTasks = visibleTasks.length > 0;

    emptyMessage.hidden = hasTasks;

    if (hasTasks) return;

    if (searchInput.value.trim()) {
        emptyTitle.textContent = "No matching tasks.";
        emptyText.textContent =
            "Try another search term.";
    } else if (currentFilter === "completed") {
        emptyTitle.textContent = "Nothing completed yet.";
        emptyText.textContent =
            "Finish a task and it will appear here.";
    } else if (currentFilter === "pending") {
        emptyTitle.textContent = "You're all caught up!";
        emptyText.textContent =
            "There are no tasks in progress.";
    } else {
        emptyTitle.textContent = "A fresh start.";
        emptyText.textContent =
            "Add your first task and make today count.";
    }
}

function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = getVisibleTasks();

    visibleTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    updateEmptyState(visibleTasks);
    updateStatistics();
}


/* =========================================
   CLEAR TASKS
========================================= */

clearBtn.addEventListener("click", function () {
    if (tasks.length === 0) {
        alert("There are no tasks to clear.");
        return;
    }

    if (!confirm("Delete all tasks? This cannot be undone.")) {
        return;
    }

    tasks = [];
    saveTasks();
    renderTasks();
});

clearCompletedBtn.addEventListener("click", function () {
    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    if (!confirm("Remove all completed tasks?")) return;

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
});


/* =========================================
   EXPORT TASKS
========================================= */

exportBtn.addEventListener("click", function () {
    if (tasks.length === 0) {
        alert("Add some tasks before exporting.");
        return;
    }

    const exportData = {
        exportedAt: new Date().toISOString(),
        tasks: tasks
    };

    const file = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "focusflow-tasks.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});


/* =========================================
   MOTIVATIONAL QUOTES
========================================= */

const quotes = [
    {
        text: "Small progress is still progress.",
        author: "FocusFlow"
    },
    {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain"
    },
    {
        text: "Great things are done by a series of small things.",
        author: "Vincent van Gogh"
    },
    {
        text: "It always seems impossible until it's done.",
        author: "Nelson Mandela"
    },
    {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    },
    {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        text: "Start where you are. Use what you have. Do what you can.",
        author: "Arthur Ashe"
    }
];

function showNewQuote() {
    let index = Math.floor(Math.random() * quotes.length);

    if (quotes.length > 1) {
        while (index === lastQuoteIndex) {
            index = Math.floor(Math.random() * quotes.length);
        }
    }

    lastQuoteIndex = index;

    quote.textContent = quotes[index].text;
    quoteAuthor.textContent = "— " + quotes[index].author;
}

newQuoteBtn.addEventListener("click", showNewQuote);


/* =========================================
   START APP
========================================= */

updateWelcome();
updateFilterButtons();
renderTasks();
showNewQuote();
