document.addEventListener("DOMContentLoaded", () => {
  // Load todos from localStorage or start with an empty array
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  // Grab DOM elements
  const listEl = document.getElementById("todo-list");
  const inputEl = document.getElementById("new-todo");
  const filterButtons = document.querySelectorAll(".filters button");

  // Set current filter from URL hash or default to "all"
  let currentFilter = window.location.hash.replace("#", "") || "all";
  let draggedId = null; // track which todo is being dragged

  // Save todos array to localStorage
  function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  // Add a new todo (or subtask if parentId is provided)
  function addTodo(text, parentId = null) {
    todos.push({
      id: Date.now().toString(), // unique id
      text,
      completed: false,
      parentId
    });
    saveTodos();
    render(); // update the UI
  }

  // Add todo when Enter is pressed in input field
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && inputEl.value.trim()) {
      addTodo(inputEl.value.trim());
      inputEl.value = ""; // clear input after adding
    }
  });

  // Delete a todo (and its subtasks if any)
  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id && t.parentId !== id);
    saveTodos();
    render();
  }

  // Toggle the completed state of a todo
  function toggleComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    saveTodos();
    render();
  }

  // Change the current filter and update active button
  function setFilter(filter) {
    currentFilter = filter;
    window.location.hash = filter; // update URL

    filterButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });

    render();
  }

  // Add click events to filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setFilter(btn.dataset.filter);
    });
  });

  // Listen for hash changes in the URL (back/forward buttons)
  window.addEventListener("hashchange", () => {
    currentFilter = window.location.hash.replace("#", "") || "all";
    setFilter(currentFilter);
  });

  // Handle drag & drop logic for todos and subtasks
  function handleDrop(targetId) {
    if (draggedId === targetId) return;

    const dragged = todos.find(t => t.id === draggedId);
    const target = todos.find(t => t.id === targetId);
    if (!dragged || !target) return;

    // If dragging a subtask, reassign its parent
    if (dragged.parentId) {
      dragged.parentId = target.parentId || target.id;
    } else {
      // Dragging a parent task
      const children = todos.filter(t => t.parentId === dragged.id);

      // Remove dragged task and its children temporarily
      todos = todos.filter(t => t.id !== dragged.id && t.parentId !== dragged.id);

      // Insert dragged task (and children) before target
      const index = todos.findIndex(t => t.id === target.id);
      todos.splice(index, 0, dragged, ...children);
    }

    saveTodos();
    render();
  }

  // Create a todo or subtask element in the DOM
  function createTodoElement(todo, isSub = false) {
    const li = document.createElement("li");
    li.classList.add("todo");
    if (isSub) li.classList.add("subtask");
    if (todo.completed) li.classList.add("completed");

    li.draggable = true;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <div class="row">
          <input type="checkbox" ${todo.completed ? "checked" : ""}>
          <span class="text">${todo.text}</span>
          ${!isSub ? '<button class="subtask-btn">+</button>' : ""}
          <button class="delete">x</button>
      </div>
    `;

    // Toggle completion when checkbox is clicked
    li.querySelector("input").addEventListener("change", () => {
      toggleComplete(todo.id);
    });

    // Delete the todo when delete button is clicked
    li.querySelector(".delete").addEventListener("click", () => {
      deleteTodo(todo.id);
    });

    // Add subtask when "+" button is clicked
    if (!isSub) {
      li.querySelector(".subtask-btn").addEventListener("click", () => {
        const text = prompt("Subtask name?");
        if (text && text.trim()) {
          addTodo(text.trim(), todo.id);
        }
      });
    }

    // Drag events
    li.addEventListener("dragstart", () => {
      draggedId = todo.id;
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });
    li.addEventListener("dragover", e => e.preventDefault()); // allow drop
    li.addEventListener("drop", () => handleDrop(todo.id));

    return li;
  }

  // Render todos to the DOM
  function render() {
    listEl.innerHTML = "";

    // Filter todos based on current filter
    const filtered = todos.filter(t => {
      if (currentFilter === "active") return !t.completed;
      if (currentFilter === "completed") return t.completed;
      return true; // show all
    });

    // Render parent tasks first
    filtered.filter(t => !t.parentId).forEach(parent => {
      listEl.appendChild(createTodoElement(parent));

      // Render subtasks
      filtered.filter(t => t.parentId === parent.id).forEach(child => {
        listEl.appendChild(createTodoElement(child, true));
      });
    });
  }

  // Initialize the app
  setFilter(currentFilter);
  render();
});
