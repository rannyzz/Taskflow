const taskInput = document.getElementById('taskInput');
    const priorityInput = document.getElementById('priorityInput');
    const dateInput = document.getElementById('dateInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const themeBtn = document.getElementById('themeBtn');
    const clearDoneBtn = document.getElementById('clearDoneBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    const totalTasks = document.getElementById('totalTasks');
    const doneTasks = document.getElementById('doneTasks');
    const pendingTasks = document.getElementById('pendingTasks');
    const highTasks = document.getElementById('highTasks');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    let tasks = JSON.parse(localStorage.getItem('taskflow_tasks')) || [];
    let currentFilter = 'todas';
    let draggedIndex = null;

    const savedTheme = localStorage.getItem('taskflow_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }

    function saveTasks() {
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    }

    function saveTheme() {
      const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('taskflow_theme', theme);
    }

    function formatDate(date) {
      if (!date) return 'Sem data';
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }

    function getPriorityClass(priority) {
      if (priority === 'Alta') return 'priority-high';
      if (priority === 'Média') return 'priority-medium';
      return 'priority-low';
    }

    function addTask() {
      const text = taskInput.value.trim();
      const priority = priorityInput.value;
      const dueDate = dateInput.value;

      if (text === '') {
        alert('Digite uma tarefa antes de adicionar.');
        return;
      }

      tasks.push({
        id: Date.now(),
        text,
        priority,
        dueDate,
        done: false,
        createdAt: new Date().toLocaleString('pt-BR')
      });

      taskInput.value = '';
      dateInput.value = '';
      saveTasks();
      renderTasks();
    }

    function toggleTask(id) {
      tasks = tasks.map(task => {
        if (task.id === id) {
          return { ...task, done: !task.done };
        }
        return task;
      });
      saveTasks();
      renderTasks();
    }

    function deleteTask(id) {
      const confirmDelete = confirm('Tem certeza que deseja excluir esta tarefa?');
      if (!confirmDelete) return;
      tasks = tasks.filter(task => task.id !== id);
      saveTasks();
      renderTasks();
    }

    function editTask(id) {
      const task = tasks.find(task => task.id === id);
      const newText = prompt('Editar tarefa:', task.text);
      if (newText === null) return;

      const cleanedText = newText.trim();
      if (cleanedText === '') {
        alert('A tarefa não pode ficar vazia.');
        return;
      }

      task.text = cleanedText;
      saveTasks();
      renderTasks();
    }

    function clearDone() {
      tasks = tasks.filter(task => !task.done);
      saveTasks();
      renderTasks();
    }

    function clearAll() {
      const confirmClear = confirm('Isso vai apagar todas as tarefas. Continuar?');
      if (!confirmClear) return;
      tasks = [];
      saveTasks();
      renderTasks();
    }

    function filteredTasks() {
      const search = searchInput.value.toLowerCase().trim();

      return tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(search);

        if (currentFilter === 'pendentes') return !task.done && matchesSearch;
        if (currentFilter === 'concluidas') return task.done && matchesSearch;
        return matchesSearch;
      });
    }

    function updateStats() {
      const total = tasks.length;
      const done = tasks.filter(task => task.done).length;
      const pending = total - done;
      const high = tasks.filter(task => task.priority === 'Alta').length;
      const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

      totalTasks.textContent = total;
      doneTasks.textContent = done;
      pendingTasks.textContent = pending;
      highTasks.textContent = high;
      progressFill.style.width = percentage + '%';
      progressText.textContent = percentage + '% concluído';
    }

    function renderTasks() {
      const list = filteredTasks();
      taskList.innerHTML = '';

      if (list.length === 0) {
        taskList.innerHTML = '<div class="empty">Nenhuma tarefa encontrada.</div>';
        updateStats();
        return;
      }

      list.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.draggable = true;
        li.dataset.id = task.id;

        li.innerHTML = `
          <div class="task-left">
            <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <div class="task-content ${task.done ? 'done' : ''}">
              <h3>${task.text}</h3>
              <div class="task-meta">
                <span class="badge ${getPriorityClass(task.priority)}">${task.priority}</span>
                <span>Entrega: ${formatDate(task.dueDate)}</span>
                <span>Criada em: ${task.createdAt}</span>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button class="edit-btn" onclick="editTask(${task.id})">Editar</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Excluir</button>
          </div>
        `;

        li.addEventListener('dragstart', () => {
          draggedIndex = tasks.findIndex(t => t.id === task.id);
          li.classList.add('dragging');
        });

        li.addEventListener('dragend', () => {
          li.classList.remove('dragging');
        });

        li.addEventListener('dragover', (e) => {
          e.preventDefault();
        });

        li.addEventListener('drop', () => {
          const targetIndex = tasks.findIndex(t => t.id === task.id);
          if (draggedIndex === null || draggedIndex === targetIndex) return;

          const draggedTask = tasks[draggedIndex];
          tasks.splice(draggedIndex, 1);
          tasks.splice(targetIndex, 0, draggedTask);

          saveTasks();
          renderTasks();
        });

        taskList.appendChild(li);
      });

      updateStats();
    }

    addBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });

    searchInput.addEventListener('input', renderTasks);

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks();
      });
    });

    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      saveTheme();
    });

    clearDoneBtn.addEventListener('click', clearDone);
    clearAllBtn.addEventListener('click', clearAll);

    renderTasks();

    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
    window.editTask = editTask;