document.addEventListener("DOMContentLoaded", () => {
  // get saved tasks if they exist
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

 
  const listEl = document.getElementById("todo-list");
  const inputEl = document.getElementById("new-todo");
  const filterButtons = document.querySelectorAll(".filters button");

  // default filter from URL or show all
  let currentFilter = window.location.hash.replace("#", "") || "all";
  let draggedId = null; // stores which task is being dragged

  // save tasks in browser storage
  function saveTasks() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  // add new task (or subtask)
  function addTask(text, parentId = null) {
    todos.push({
      id: Date.now().toString(), // simple unique id
      text,
      completed: false,
      parentId
    });
    console.log("task added:", text);
    alert("Task added successfully!");

    saveTasks();
    renderTasks(); // refresh list
  }

  // add task when pressing Enter
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && inputEl.value.trim()) {
      addTask(inputEl.value.trim());
      inputEl.value = ""; // clear input
    }
  });

  // delete task and its subtasks
  function deleteTask(id) {
     console.log("Deleting task with id:", id); // human touch
    todos = todos.filter(t => t.id !== id && t.parentId !== id);
    saveTasks();
    renderTasks();
  }

  // mark task done / undone
  function toggleTask(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    saveTasks();
    renderTasks();
  }

  // change filter (all / active / completed)
  function setTaskFilter(filter) {
    currentFilter = filter;
    window.location.hash = filter;

    filterButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });

    renderTasks();
  }

  // filter button clicks
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setTaskFilter(btn.dataset.filter);
    });
  });

  // update filter if URL hash changes
  window.addEventListener("hashchange", () => {
    currentFilter = window.location.hash.replace("#", "") || "all";
    setTaskFilter(currentFilter);
  });

  // handle drag & drop rearranging
  function handleTaskDrop(targetId) {
    if (draggedId === targetId) return;

    const dragged = todos.find(t => t.id === draggedId);
    const target = todos.find(t => t.id === targetId);
    if (!dragged || !target) return;

    // if dragging a subtask, just change its parent
    if (dragged.parentId) {
      dragged.parentId = target.parentId || target.id;
    } else {
      // moving a main task with its subtasks
      const children = todos.filter(t => t.parentId === dragged.id);

      todos = todos.filter(t => t.id !== dragged.id && t.parentId !== dragged.id);

      const index = todos.findIndex(t => t.id === target.id);
      todos.splice(index, 0, dragged, ...children);
    }

    saveTasks();
    renderTasks();
  }

  // build each task element
  function createTaskElement(todo, isSub = false) {
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
          ${!isSub ? '<button class="subtask-btn">&#x2B;</button>' : ""}
          <button class="delete">&#x2716;</button>
      </div>
    `;

    // checkbox toggle
    li.querySelector("input").addEventListener("change", () => {
      toggleTask(todo.id);
    });

    // delete button
    li.querySelector(".delete").addEventListener("click", () => {
      deleteTask(todo.id);
    });

    // add subtask button
    if (!isSub) {
      li.querySelector(".subtask-btn").addEventListener("click", () => {
        const text = prompt("Enter your other task in main task");
        if (text && text.trim()) {
          addTask(text.trim(), todo.id);
        }
      });
    }

    // drag events
    li.addEventListener("dragstart", () => {
      draggedId = todo.id;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", e => e.preventDefault());
    li.addEventListener("drop", () => handleTaskDrop(todo.id));

    return li;
  }

  // show tasks on screen
  function renderTasks() {
    listEl.innerHTML = "";

    const filtered = todos.filter(t => {
      if (currentFilter === "active") return !t.completed;
      if (currentFilter === "completed") return t.completed;
      return true;
    });

    // show main tasks first
    filtered.filter(t => !t.parentId).forEach(parent => {
      listEl.appendChild(createTaskElement(parent));

      // then show its subtasks
      filtered.filter(t => t.parentId === parent.id).forEach(child => {
        listEl.appendChild(createTaskElement(child, true));
      });
    });
  }

  // start app
  setTaskFilter(currentFilter);
  renderTasks();
});
