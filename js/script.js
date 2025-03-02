// DOM Elemanları
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskStats = document.getElementById('task-stats');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const errorMessage = document.getElementById('error-message');
const filterCompletedBtn = document.getElementById('filter-completed');
const sortPriorityBtn = document.getElementById('sort-priority');
const taskTemplate = document.getElementById('task-template');

// Form Elemanları
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const dueDateInput = document.getElementById('due-date');
const priorityInputs = document.getElementsByName('priority');

// İstatistik Elemanları
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const pendingCount = document.getElementById('pending-count');
const overdueCount = document.getElementById('overdue-count');

// Uygulama Durumu
let tasks = [];
let editingTaskId = null;
let showOnlyCompleted = false;
let sortByPriority = false;

// Tekrarlayan SVG ikonlar için yardımcı fonksiyon
const getSvgIcon = (type) => {
  const icons = {
    add: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg> Add Task`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
             <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
             <polyline points="17 21 17 13 7 13 7 21"></polyline>
             <polyline points="7 3 7 8 15 8"></polyline>
           </svg> Save`,
    filterCompleted: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg> Show Completed`,
    filterAll: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg> Show All`,
    sortByPriority: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                       <line x1="12" y1="5" x2="12" y2="19"></line>
                       <polyline points="19 12 12 19 5 12"></polyline>
                     </svg> Sort by Priority`,
    resetSorting: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg> Reset Sorting`,
    toggleComplete: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                     </svg>`,
    toggleCompleteDone: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9 12l2 2 4-4"></path>
                          </svg>`
  };
  return icons[type] || '';
};

// Butonları güncelleyen fonksiyonlar
const updateSubmitButton = () => {
  submitBtn.innerHTML = editingTaskId ? getSvgIcon('save') : getSvgIcon('add');
};

const updateFilterButton = () => {
  filterCompletedBtn.innerHTML = showOnlyCompleted ? getSvgIcon('filterAll') : getSvgIcon('filterCompleted');
};

const updateSortButton = () => {
  sortPriorityBtn.innerHTML = sortByPriority ? getSvgIcon('resetSorting') : getSvgIcon('sortByPriority');
};

// Uygulamayı başlatan fonksiyon
const init = () => {
  loadTasks();
  updateSubmitButton();
  updateFilterButton();
  updateSortButton();

  taskForm.addEventListener('submit', handleFormSubmit);
  cancelBtn.addEventListener('click', cancelEdit);
  filterCompletedBtn.addEventListener('click', toggleCompletedFilter);
  sortPriorityBtn.addEventListener('click', togglePrioritySort);
  taskList.addEventListener('click', handleTaskActions);

  renderTasks();
};

// LocalStorage'dan görevleri yükle
const loadTasks = () => {
  try {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      tasks = JSON.parse(savedTasks).map(task => ({
        ...task,
        createdAt: new Date(task.createdAt)
      }));
    }
  } catch (err) {
    console.error('Error loading tasks:', err);
    tasks = [];
  }
};

// Görevleri LocalStorage'a kaydet
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Seçili öncelik değerini döndür
const getSelectedPriority = () => {
  for (let input of priorityInputs) {
    if (input.checked) return input.value;
  }
  return 'medium';
};

// Seçili önceliği ayarla
const setSelectedPriority = (priority) => {
  for (let input of priorityInputs) {
    input.checked = (input.value === priority);
  }
};

// Hata mesajlarını göster/gizle
const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
};

const hideError = () => {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
};

// Görev ekleme/düzenleme formu gönderim işlemi
const handleFormSubmit = (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = getSelectedPriority();

  if (!title) return showError('Task title cannot be empty!');

  if (editingTaskId) {
    tasks = tasks.map(task =>
      task.id === editingTaskId
        ? { ...task, title, description, priority, dueDate: dueDate || undefined }
        : task
    );
    editingTaskId = null;
    formTitle.textContent = 'Add New Task';
  } else {
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      priority,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDate || undefined
    };
    tasks.push(newTask);
  }
  saveTasks();
  taskForm.reset();
  setSelectedPriority('medium');
  hideError();
  updateSubmitButton();
  renderTasks();
};

// Düzenlemeyi iptal et
const cancelEdit = () => {
  editingTaskId = null;
  formTitle.textContent = 'Add New Task';
  taskForm.reset();
  setSelectedPriority('medium');
  hideError();
  updateSubmitButton();
};

// Görev işlemleri (düzenle, sil, tamamla) için event delegation
const handleTaskActions = (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const taskItem = button.closest('.task-item');
  if (!taskItem) return;
  const taskId = taskItem.getAttribute('data-id');

  if (button.classList.contains('toggle-complete')) {
    toggleTaskCompletion(taskId);
  } else if (button.classList.contains('delete-task')) {
    deleteTask(taskId);
  } else if (button.classList.contains('edit-task')) {
    startEditTask(taskId);
  }
};

// Görevin tamamlanma durumunu değiştir
const toggleTaskCompletion = (taskId) => {
  tasks = tasks.map(task =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
};

// Görevi sil
const deleteTask = (taskId) => {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
};

// Görevi düzenlemeye başla
const startEditTask = (taskId) => {
  const task = tasks.find(task => task.id === taskId);
  if (!task) return;
  editingTaskId = taskId;
  formTitle.textContent = 'Edit Task';
  titleInput.value = task.title;
  descriptionInput.value = task.description || '';
  dueDateInput.value = task.dueDate || '';
  setSelectedPriority(task.priority);
  updateSubmitButton();
  cancelBtn.classList.remove('hidden');
  taskForm.scrollIntoView({ behavior: 'smooth' });
};

// Tamamlanmış görevleri filtrele
const toggleCompletedFilter = () => {
  showOnlyCompleted = !showOnlyCompleted;
  updateFilterButton();
  renderTasks();
};

// Önceliğe göre sıralamayı değiştir
const togglePrioritySort = () => {
  sortByPriority = !sortByPriority;
  updateSortButton();
  renderTasks();
};

// Tarihi MM/DD/YYYY formatında biçimlendir
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const dd = day < 10 ? '0' + day : day;
  const mm = month < 10 ? '0' + month : month;
  return `${mm}/${dd}/${year}`;
};

// Görevin geçerlilik durumunu kontrol et
const isOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  return due < today;
};

// Öncelik metnini döndür
const getPriorityText = (priority) => {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return '';
  }
};

// Template'ten yeni görev elemanı oluştur
const createTaskElement = (task) => {
  const clone = document.importNode(taskTemplate.content, true);
  const taskElement = clone.querySelector('.task-item');
  taskElement.setAttribute('data-id', task.id);

  const taskTitle = taskElement.querySelector('.task-title');
  const taskDescription = taskElement.querySelector('.task-description');
  const priorityBadge = taskElement.querySelector('.priority-badge');
  const dueDateElem = taskElement.querySelector('.due-date');
  const toggleCompleteBtn = taskElement.querySelector('.toggle-complete');
  const editTaskBtn = taskElement.querySelector('.edit-task');

  taskTitle.textContent = task.title;
  if (task.description) {
    taskDescription.textContent = task.description;
    taskDescription.classList.remove('hidden');
  } else {
    taskDescription.classList.add('hidden');
  }

  priorityBadge.textContent = getPriorityText(task.priority);
  priorityBadge.className = `priority-badge priority-${task.priority}`;

  if (task.dueDate) {
    const overdue = isOverdue(task);
    dueDateElem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg> ${formatDate(task.dueDate)}${overdue && !task.completed ? ' (Overdue)' : ''}`;
    if (overdue && !task.completed) {
      dueDateElem.classList.add('overdue');
    }
  } else {
    dueDateElem.classList.add('hidden');
  }

  if (task.completed) {
    taskElement.classList.add('completed');
    toggleCompleteBtn.innerHTML = getSvgIcon('toggleCompleteDone');
    toggleCompleteBtn.title = 'Mark as incomplete';
    toggleCompleteBtn.classList.add('completed');
    editTaskBtn.classList.add('hidden');
  } else {
    toggleCompleteBtn.innerHTML = getSvgIcon('toggleComplete');
  }

  return taskElement;
};

// Filtrelenmiş ve sıralanmış görevleri döndür
const getFilteredAndSortedTasks = () => {
  let result = [...tasks];
  if (showOnlyCompleted) result = result.filter(task => task.completed);
  if (sortByPriority) {
    const order = { high: 3, medium: 2, low: 1 };
    result.sort((a, b) => order[b.priority] - order[a.priority]);
  } else {
    result.sort((a, b) => b.createdAt - a.createdAt);
  }
  return result;
};

// Görev istatistiklerini güncelle
const updateTaskStatistics = () => {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.filter(task => !task.completed).length;
  const overdue = tasks.filter(task => isOverdue(task)).length;

  totalCount.textContent = tasks.length;
  completedCount.textContent = completed;
  pendingCount.textContent = pending;
  overdueCount.textContent = overdue;
};

// Ekrana görevleri render et
const renderTasks = () => {
  const filteredTasks = getFilteredAndSortedTasks();
  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyState.classList.remove('hidden');
    taskStats.classList.add('hidden');
    const emptyTitle = emptyState.querySelector('.empty-title');
    const emptySubtitle = emptyState.querySelector('.empty-subtitle');
    if (showOnlyCompleted) {
      emptyTitle.textContent = 'No completed tasks found.';
      emptySubtitle.textContent = 'They will appear here as you complete tasks.';
    } else {
      emptyTitle.textContent = 'No tasks have been added yet.🥲';
      emptySubtitle.textContent = 'Use the form above to add a new task.';
    }
  } else {
    emptyState.classList.add('hidden');
    filteredTasks.forEach(task => taskList.appendChild(createTaskElement(task)));
    if (tasks.length > 0) {
      updateTaskStatistics();
      taskStats.classList.remove('hidden');
    } else {
      taskStats.classList.add('hidden');
    }
  }
};

document.addEventListener('DOMContentLoaded', init);