let items = JSON.parse(localStorage.getItem("items")) || [];
let lastDate = localStorage.getItem("lastDate");

const list = document.getElementById("list");
const circle = document.getElementById("circle");
const progressText = document.getElementById("progressText");

const modal = document.getElementById("modal");
const typeSelect = document.getElementById("type");
const daysDiv = document.getElementById("days");

const circumference = 2 * Math.PI * 54;

/* DATE */
document.getElementById("date").innerText =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

/* DAILY RESET */
const today = new Date().toDateString();
if (lastDate !== today) {
  items.forEach(i => i.done = false);
  localStorage.setItem("lastDate", today);
}

/* MODAL */
addBtn.onclick = () => modal.classList.add("active");
closeModal.onclick = () => modal.classList.remove("active");

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.remove("active");
};

/* TYPE */
typeSelect.onchange = () => {
  daysDiv.classList.toggle("hidden", typeSelect.value !== "specific");
};

/* ADD */
saveTask.onclick = () => {
  const text = taskInput.value.trim();
  if (!text) return;

  let days = [];
  if (typeSelect.value === "specific") {
    document.querySelectorAll("#days input:checked").forEach(cb =>
      days.push(parseInt(cb.value))
    );
  }

  items.push({ text, type: typeSelect.value, days, done: false });

  modal.classList.remove("active");
  taskInput.value = "";
  save();
};

/* FILTER */
function shouldShow(item) {
  const today = new Date().getDay();
  if (item.type === "daily") return true;
  if (item.type === "alternate") return new Date().getDate() % 2 === 0;
  if (item.type === "specific") return item.days.includes(today);
  return true;
}

/* HAPTIC */
function vibrate(ms = 10) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* RENDER */
function render() {
  list.innerHTML = "";
  const todayItems = items.filter(shouldShow);

  todayItems.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "item-wrapper";

    const bg = document.createElement("div");
    bg.className = "delete-bg";
    bg.innerText = "Delete";

    const div = document.createElement("div");
    div.className = "item " + (item.done ? "completed" : "");

    div.innerHTML = `
      <input type="checkbox" ${item.done ? "checked" : ""}>
      <span>${item.text}</span>
    `;

    /* CHECKBOX */
    div.querySelector("input").onchange = (e) => {
      item.done = e.target.checked;

      div.classList.add("tap");
      vibrate(10);

      setTimeout(() => div.classList.remove("tap"), 100);

      save();
    };

    /* SWIPE */
    let startX = 0;

    div.ontouchstart = e => {
      startX = e.touches[0].clientX;
    };

    div.ontouchmove = e => {
      let moveX = e.touches[0].clientX - startX;
      div.style.transform = `translateX(${moveX}px)`;

      if (moveX > 40) {
        bg.style.opacity = "1";
      } else {
        bg.style.opacity = "0";
      }
    };

    div.ontouchend = e => {
      let diff = e.changedTouches[0].clientX - startX;

      if (diff > 80) {
        div.style.transform = "translateX(80px)";
        bg.style.opacity = "1";
        vibrate(20);
      }

      else if (diff < -80) {
        item.done = true;
        vibrate(15);
        save();
      }

      else {
        div.style.transform = "translateX(0)";
        bg.style.opacity = "0";
      }
    };

    /* DELETE */
    bg.onclick = () => {
      vibrate(30);

      div.style.transform = "translateX(100%)";
      div.style.opacity = "0";

      setTimeout(() => {
        items.splice(index, 1);
        save();
      }, 200);
    };

    wrapper.append(bg, div);
    list.appendChild(wrapper);
  });

  updateProgress(todayItems);
}

/* PROGRESS */
function updateProgress(list) {
  const percent = list.length
    ? list.filter(i => i.done).length / list.length
    : 0;

  circle.style.strokeDashoffset = 339 * (1 - percent);
  progressText.innerText = Math.round(percent * 100) + "%";
}

/* SAVE */
function save() {
  localStorage.setItem("items", JSON.stringify(items));
  render();
}

render();

/* PWA */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
