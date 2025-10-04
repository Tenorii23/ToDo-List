// Sound effects
const addTaskSound = new Audio('sounds/ding.mp3');
const deleteTaskSound = new Audio('sounds/poof.mp3');
const notifySound = new Audio('sounds/alert.mp3');

// DOM elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const taskList = document.getElementById('taskList');
const exportTasksBtn = document.getElementById('exportTasks');
const importTasksBtn = document.getElementById('importTasks');
const importFileInput = document.getElementById('importFile');
const themeToggle = document.getElementById('themeToggle');
const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
const editTaskForm = document.getElementById('editTaskForm');
const editTaskName = document.getElementById('editTaskName');
const editTaskCategory = document.getElementById('editTaskCategory');
const editTaskPriority = document.getElementById('editTaskPriority');
const editTaskDueDate = document.getElementById('editTaskDueDate');
const saveEditTask = document.getElementById('saveEditTask');

// Current editing task ID
let currentEditTaskId = null;

// Load tasks from localStorage
const loadTasks = () => {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach(task => addTaskToDOM(task));
  initializeSortable();
  checkDueDates();
};

// Add task to DOM
const addTaskToDOM = (task) => {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center';
  li.dataset.id = task.id;
  li.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-grip-vertical me-3 handle"></i>
      <div>
        <span class="fw-bold ${getPriorityClass(task.priority)}">${task.name}</span>
        <div>
          <span class="task-category category-${task.category}">${task.category}</span>
          ${task.dueDate ? `<span class="due-date" data-due="${task.dueDate}">Due: ${formatDueDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
    </div>
    <div>
      <button class="btn btn-sm btn-outline-purple me-2 editTask" data-bs-toggle="modal" data-bs-target="#editTaskModal">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger deleteTask">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  taskList.appendChild(li);
  addTaskSound.play();
};

// Format due date for display
const formatDueDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

// Get priority class for styling
const getPriorityClass = (priority) => `priority-${priority}`;

// Save tasks to localStorage
const saveTasks = () => {
  const tasks = Array.from(taskList.children).map(li => ({
    id: li.dataset.id,
    name: li.querySelector('.fw-bold').textContent,
    category: li.querySelector('.task-category').textContent,
    priority: [...li.querySelector('.fw-bold').classList]
      .find(c => c.startsWith('priority-'))
      .replace('priority-', ''),
    dueDate: li.querySelector('.due-date')?.dataset.due || null
  }));
  localStorage.setItem('tasks', JSON.stringify(tasks));
  checkDueDates();
};

// Initialize SortableJS for drag-and-drop
const initializeSortable = () => {
  new Sortable(taskList, {
    animation: 150,
    handle: '.handle',
    onEnd: saveTasks
  });
};

// Add new task
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const taskName = taskInput.value.trim();
  if (taskName) {
    const task = {
      id: Date.now().toString(),
      name: taskName,
      category: taskCategory.value,
      priority: taskPriority.value,
      dueDate: taskDueDate.value
    };
    addTaskToDOM(task);
    saveTasks();
    taskForm.reset();
  }
});

// Delete task
taskList.addEventListener('click', (e) => {
  if (e.target.closest('.deleteTask')) {
    const li = e.target.closest('li');
    li.classList.add('fade-out');
    deleteTaskSound.play();
    setTimeout(() => {
      li.remove();
      saveTasks();
    }, 500);
  }
});

// Edit task
taskList.addEventListener('click', (e) => {
  if (e.target.closest('.editTask')) {
    const li = e.target.closest('li');
    currentEditTaskId = li.dataset.id;
    editTaskName.value = li.querySelector('.fw-bold').textContent;
    editTaskCategory.value = li.querySelector('.task-category').textContent;
    editTaskPriority.value = [...li.querySelector('.fw-bold').classList]
      .find(c => c.startsWith('priority-'))
      .replace('priority-', '');
    const dueDateElement = li.querySelector('.due-date');
    editTaskDueDate.value = dueDateElement?.dataset.due || '';
  }
});

// Save edited task
saveEditTask.addEventListener('click', () => {
  const li = document.querySelector(`[data-id="${currentEditTaskId}"]`);
  if (li) {
    li.querySelector('.fw-bold').textContent = editTaskName.value;
    li.querySelector('.task-category').textContent = editTaskCategory.value;
    li.querySelector('.task-category').className = `task-category category-${editTaskCategory.value}`;
    li.querySelector('.fw-bold').className = `fw-bold ${getPriorityClass(editTaskPriority.value)}`;

    const dueDateElement = li.querySelector('.due-date');
    if (editTaskDueDate.value) {
      if (!dueDateElement) {
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'due-date';
        dueDateSpan.dataset.due = editTaskDueDate.value;
        dueDateSpan.textContent = `Due: ${formatDueDate(editTaskDueDate.value)}`;
        li.querySelector('.task-category').after(dueDateSpan);
      } else {
        dueDateElement.textContent = `Due: ${formatDueDate(editTaskDueDate.value)}`;
        dueDateElement.dataset.due = editTaskDueDate.value;
      }
    } else if (dueDateElement) {
      dueDateElement.remove();
    }

    saveTasks();
    editTaskModal.hide();
  }
});

// Export tasks
exportTasksBtn.addEventListener('click', () => {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Import tasks
importTasksBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const tasks = JSON.parse(event.target.result);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    location.reload();
  };
  reader.readAsText(file);
});

// Toggle theme
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('neon-theme');
  const isNeon = document.body.classList.contains('neon-theme');
  localStorage.setItem('neonTheme', isNeon);
  themeToggle.innerHTML = isNeon
    ? '<i class="fas fa-moon"></i> Dark Theme'
    : '<i class="fas fa-sun"></i> Neon Theme';
});

// Check for due dates and notify
const checkDueDates = () => {
  const now = new Date();
  document.querySelectorAll('.due-date').forEach(el => {
    const dueDate = new Date(el.dataset.due);
    if (dueDate <= now && !el.classList.contains('overdue')) {
      el.classList.add('overdue');
      notifySound.play();
      if (Notification.permission === 'granted') {
        new Notification('Task Due!', {
          body: `Task "${el.parentElement.querySelector('.fw-bold').textContent}" is due!`,
          icon: 'https://via.placeholder.com/48/9b59b6/ffffff?text=!'
        });
      }
    }
  });
};

// Request notification permission
if (Notification.permission !== 'granted') {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      checkDueDates();
    }
  });
}

// Load theme preference
if (localStorage.getItem('neonTheme') === 'true') {
  document.body.classList.add('neon-theme');
  themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Theme';
}

// Load tasks on startup
loadTasks();
