class Task {
    //Task constructor
    
    constructor(id, name, description, dueDate, reminder, status, createdAt) {
        this.id = id;  //Unique identifier for the task
        this.name = name;//Name of the task
        this.description = description;// Task description
        this.dueDate = dueDate;// Due date for the task (YYYY-MM-DD format)
        this.reminder = reminder;//Reminder date/time (ISO string format)
        this.status = status;//Task status ('pending' or 'completed')
        this.createdAt = createdAt || new Date();//Date when task was created
    }
}

class TaskManager {
    constructor() {
        this.tasks = []; // Array to store all tasks
        this.currentTaskId = null; // Track which task is being edited
        this.init(); // Initialize the application
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadTasks(); // Load tasks from localStorage
        this.renderTasks(); // Display tasks in the UI
        this.addEventListeners(); // Set up event handlers
        this.checkReminders(); // Check for upcoming reminders
    }

    /**
     * Add event listeners for UI interactions
     */
    addEventListeners() {
        // Form submission for adding/updating tasks
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Button event listeners
        document.getElementById('updateBtn').addEventListener('click', () => this.updateTask());
        document.getElementById('cancelBtn').addEventListener('click', () => this.resetForm());
        
        // Search and filter event listeners
        document.getElementById('searchInput').addEventListener('input', () => this.renderTasks());
        document.getElementById('filterStatus').addEventListener('change', () => this.renderTasks());
        document.querySelector('.btn-search').addEventListener('click', () => this.renderTasks());
    }

    /**
     * Add a new task
     */
    addTask() {
        // Get form values
        const name = document.getElementById('taskName').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const dueDate = document.getElementById('taskDueDate').value;
        const reminder = document.getElementById('taskReminder').value;
        const status = document.getElementById('taskStatus').value;

        // Validate required fields
        if (!name) {
            this.showFeedback('Task name is required!', 'error');
            return;
        }

        // Create new task and add to array
        const task = new Task(this.generateId(), name, description, dueDate, reminder, status);
        this.tasks.push(task);
        
        // Save, reset form, and update UI
        this.saveTasks();
        this.resetForm();
        this.renderTasks();
        this.showFeedback('Task added successfully!', 'success');
    }

    /**
     * Edit an existing task
     * @param {string} taskId - ID of the task to edit
     */
    editTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            this.currentTaskId = taskId;
            
            // Populate form with task data
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskReminder').value = task.reminder || '';
            document.getElementById('taskStatus').value = task.status;
            
            // Show update/cancel buttons instead of submit
            document.getElementById('submitBtn').style.display = 'none';
            document.getElementById('updateBtn').style.display = 'inline-block';
            document.getElementById('cancelBtn').style.display = 'inline-block';
        }
    }

    /**
     * Update an existing task
     */
    updateTask() {
        if (!this.currentTaskId) return;

        // Get updated form values
        const name = document.getElementById('taskName').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const dueDate = document.getElementById('taskDueDate').value;
        const reminder = document.getElementById('taskReminder').value;
        const status = document.getElementById('taskStatus').value;

        // Validate required fields
        if (!name) {
            this.showFeedback('Task name is required!', 'error');
            return;
        }

        // Find and update the task
        const taskIndex = this.tasks.findIndex(task => task.id === this.currentTaskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { 
                ...this.tasks[taskIndex], 
                name, 
                description, 
                dueDate, 
                reminder, 
                status 
            };
            
            // Save, reset form, and update UI
            this.saveTasks();
            this.resetForm();
            this.renderTasks();
            this.showFeedback('Task updated successfully!', 'success');
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            
            // Reset form if deleting the currently edited task
            if (this.currentTaskId === taskId) this.resetForm();
            
            this.showFeedback('Task deleted successfully!', 'success');
        }
    }

    /**
     * Toggle task status between completed/pending
     * @param {string} taskId - ID of the task to toggle
     */
    toggleStatus(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            this.saveTasks();
            this.renderTasks();
            this.showFeedback(`Task marked as ${task.status}!`, 'success');
        }
    }

    /**
     * Reset the task form to its initial state
     */
    resetForm() {
        document.getElementById('task-form').reset();
        this.currentTaskId = null;
        
        // Show submit button and hide update/cancel buttons
        document.getElementById('submitBtn').style.display = 'inline-block';
        document.getElementById('updateBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'none';
    }

    /**
     * Render tasks in the UI based on current filters/search
     */
    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        const filteredTasks = this.getFilteredTasks();
        
        // Show message if no tasks found
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p>No tasks found.</p>';
            return;
        }

        // Create and append task elements
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            if (task.status === 'completed') taskItem.classList.add('task-completed');

            // Format dates for display
            const formattedDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            const formattedReminder = task.reminder ? new Date(task.reminder).toLocaleString() : 'No reminder';
            const formattedCreatedDate = new Date(task.createdAt).toLocaleDateString();

            // Task HTML structure
            taskItem.innerHTML = `
                <div class="task-title">
                    <span>${task.name}</span>
                    <span class="task-status ${task.status}">${task.status}</span>
                </div>
                <div class="task-description">${task.description || 'No description'}</div>
                <div class="task-meta">
                    <span>Created: ${formattedCreatedDate}</span>
                    <span>Due: ${formattedDueDate}</span>
                    <span>Reminder: ${formattedReminder}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm toggle-status-btn">${task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}</button>
                    <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                </div>
            `;

            // Add event listeners to task buttons
            taskItem.querySelector('.toggle-status-btn').addEventListener('click', () => this.toggleStatus(task.id));
            taskItem.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
            taskItem.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

            taskList.appendChild(taskItem);
        });
    }

    /**
     * Get tasks filtered by status and search term
     * @returns {Array} Filtered tasks
     */
    getFilteredTasks() {
        const filterStatus = document.getElementById('filterStatus').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        let filteredTasks = this.tasks.filter(task => {
            const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
            const matchesSearch = task.name.toLowerCase().includes(searchTerm) || 
                                 (task.description && task.description.toLowerCase().includes(searchTerm));
            return matchesStatus && matchesSearch;
        });

        return filteredTasks;
    }

    showFeedback(message, type) {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.style.display = 'block';
        
        // Hide feedback after 3 seconds
        setTimeout(() => feedbackElement.style.display = 'none', 3000);
    }

    /**
     * Save tasks to localStorage
     */
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    /**
     * Load tasks from localStorage
     */
    loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    }

    /**
     * Check for upcoming reminders
     */
    checkReminders() {
        const now = new Date();
        const upcomingTasks = this.tasks.filter(task => {
            if (!task.reminder) return false;
            const reminderTime = new Date(task.reminder);
            return reminderTime > now && reminderTime < new Date(now.getTime() + 30 * 60 * 1000); // Next 30 minutes
        });

        if (upcomingTasks.length > 0) {
            const taskNames = upcomingTasks.map(task => task.name).join(', ');
            this.showFeedback(`Reminder: Upcoming tasks - ${taskNames}`, 'success');
        }
    }

    /**
     * Generate a unique ID for new tasks
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
});