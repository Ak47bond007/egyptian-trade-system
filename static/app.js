// Select elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Load todos from localStorage
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Render todos
function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = todo.completed ? 'completed' : '';
    li.innerHTML = `
      <span>${todo.text}</span>
      <div>
        <button class="delete-btn" data-index="${idx}">Delete</button>
        <button class="toggle-btn" data-index="${idx}">${todo.completed ? 'Undo' : 'Complete'}</button>
      </div>
    `;
    todoList.appendChild(li);
  });
}

// Add todo
todoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    todos.push({ text, completed: false });
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
    todoInput.value = '';
  }
});

// Delete or toggle todo
todoList.addEventListener('click', function(e) {
  const idx = e.target.dataset.index;
  if (e.target.classList.contains('delete-btn')) {
    todos.splice(idx, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
  } else if (e.target.classList.contains('toggle-btn')) {
    todos[idx].completed = !todos[idx].completed;
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
  }
});

// Initial render
renderTodos();