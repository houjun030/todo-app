/* ========================================
   Todo App – app.js
   ======================================== */
(() => {
  'use strict';

  // ─── Constants ──────────────────────────
  const STORAGE_KEY = 'todo_app_tasks';

  // ─── DOM References ─────────────────────
  const taskInput    = document.getElementById('task-input');
  const addBtn       = document.getElementById('add-btn');
  const taskList     = document.getElementById('task-list');
  const emptyState   = document.getElementById('empty-state');
  const pendingCount = document.getElementById('pending-count');
  const doneCount    = document.getElementById('done-count');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const clearDoneBtn = document.getElementById('clear-done-btn');
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const inputArea    = document.getElementById('input-area');

  // ─── State ──────────────────────────────
  let tasks = loadTasks();
  let currentFilter = 'all';

  // ─── Init ───────────────────────────────
  render();

  // ─── Event Listeners ───────────────────
  addBtn.addEventListener('click', handleAdd);
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdd();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  clearDoneBtn.addEventListener('click', handleClearDone);

  // ─── Handlers ───────────────────────────
  function handleAdd() {
    const text = taskInput.value.trim();
    if (!text) {
      inputArea.classList.add('shake');
      setTimeout(() => inputArea.classList.remove('shake'), 400);
      taskInput.focus();
      return;
    }

    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text,
      done: false,
      createdAt: Date.now(),
    };

    tasks.unshift(task);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    render();
  }

  function handleToggle(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      saveTasks();
      render();
    }
  }

  function handleDelete(id) {
    const li = document.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.style.animation = 'taskOut 0.3s var(--ease-out) forwards';
      li.addEventListener('animationend', () => {
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        render();
      }, { once: true });
    }
  }

  function handleClearDone() {
    const doneItems = document.querySelectorAll('.task-item.done');
    if (doneItems.length === 0) return;

    doneItems.forEach((li, i) => {
      li.style.animation = `taskOut 0.3s var(--ease-out) ${i * 0.05}s forwards`;
    });

    setTimeout(() => {
      tasks = tasks.filter((t) => !t.done);
      saveTasks();
      render();
    }, doneItems.length * 50 + 300);
  }

  // ─── Render ─────────────────────────────
  function render() {
    const total   = tasks.length;
    const doneN   = tasks.filter((t) => t.done).length;
    const pendN   = total - doneN;
    const percent = total === 0 ? 0 : Math.round((doneN / total) * 100);

    // Stats
    pendingCount.textContent = pendN;
    doneCount.textContent    = doneN;
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';

    // Clear button visibility
    clearDoneBtn.style.display = doneN > 0 ? 'block' : 'none';

    // Filter tasks
    let visible = tasks;
    if (currentFilter === 'pending') visible = tasks.filter((t) => !t.done);
    if (currentFilter === 'done')    visible = tasks.filter((t) => t.done);

    // Empty state
    if (visible.length === 0) {
      emptyState.classList.remove('hidden');
      taskList.innerHTML = '';
      // Adjust empty-state message based on filter
      const emptyTitle = emptyState.querySelector('.empty-title');
      const emptySub   = emptyState.querySelector('.empty-subtitle');
      if (total === 0) {
        emptyTitle.textContent = '还没有待办事项';
        emptySub.textContent   = '在上方输入框中添加你的第一个任务吧！';
      } else if (currentFilter === 'pending') {
        emptyTitle.textContent = '🎉 太棒了！';
        emptySub.textContent   = '所有任务都已完成！';
      } else if (currentFilter === 'done') {
        emptyTitle.textContent = '还没有完成任何任务';
        emptySub.textContent   = '快去完成你的第一个任务吧！';
      }
      return;
    }

    emptyState.classList.add('hidden');

    // Build task list
    taskList.innerHTML = visible
      .map(
        (t, i) => `
      <li class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}" style="animation-delay:${i * 0.04}s">
        <label class="task-checkbox">
          <input type="checkbox" ${t.done ? 'checked' : ''} aria-label="标记完成" />
          <span class="checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </label>
        <span class="task-text">${escapeHtml(t.text)}</span>
        <button class="delete-btn" aria-label="删除任务">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </li>`
      )
      .join('');

    // Bind events on newly rendered items
    taskList.querySelectorAll('.task-checkbox input').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.closest('.task-item').dataset.id;
        handleToggle(id);
      });
    });

    taskList.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.task-item').dataset.id;
        handleDelete(id);
      });
    });
  }

  // ─── Helpers ────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load tasks from localStorage', e);
      return [];
    }
  }
})();
