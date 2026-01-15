/* ==============================
   Ashyq Qala — Demo Map v0.5
================================= */

const LS_KEY = "ashyq_qala_issues_v1";

// 1. Глобальные переменные (доступны везде)
const mapCanvas = document.getElementById("mapCanvas");
const issueList = document.getElementById("issueList");
const statsLine = document.getElementById("statsLine");
const btnAddIssue = document.getElementById("btnAddIssue");
const btnClearAll = document.getElementById("btnClearAll");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");

const modal = document.getElementById("issueModal");
const btnSave = document.getElementById("btnSaveIssue");
const coordsView = document.getElementById("coordsView");
const issueCategory = document.getElementById("issueCategory");
const issueStatus = document.getElementById("issueStatus");
const issueDesc = document.getElementById("issueDesc");

let issues = loadIssues();
let addMode = false;
let pickedPoint = null;
let activeId = null;

// 2. Вспомогательные функции
function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

function loadIssues() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveIssues() { localStorage.setItem(LS_KEY, JSON.stringify(issues)); }

function categoryLabel(code) {
  const map = { roads: "Дороги", light: "Освещение", trash: "Мусор", eco: "Экология", safety: "Безопасность", other: "Другое" };
  return map[code] || "Другое";
}

function statusLabel(code) {
  const map = { new: "Новая", work: "В работе", done: "Решена" };
  return map[code] || "Новая";
}


// Инициализация событий
document.addEventListener("DOMContentLoaded", () => {

    // Кнопка "+ Добавить проблему"
    document.getElementById("btnAddIssue")?.addEventListener("click", () => {
        addMode = true;
        pickedPoint = null; // Сбрасываем старую точку
        if (issueModal) issueModal.classList.add("show");
        if (btnSaveIssue) btnSaveIssue.disabled = true;
        if (coordsView) coordsView.textContent = "Кликните по карте для выбора точки";
    });

    // Клик по карте для выбора точки
    mapCanvas?.addEventListener("click", (e) => {
        if (!addMode) return;

        const rect = mapCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        pickedPoint = { xPct: x, yPct: y };

        // Визуальное подтверждение
        if (coordsView) coordsView.textContent = "Точка выбрана!";
        if (btnSaveIssue) btnSaveIssue.disabled = false;

        // Рисуем временный маркер-превью
        mapCanvas.querySelectorAll(".marker-preview").forEach(m => m.remove());
        const preview = document.createElement("div");
        preview.className = "marker marker-preview";
        preview.style.left = `${x * 100}%`;
        preview.style.top = `${y * 100}%`;
        mapCanvas.appendChild(preview);
    });
});



// 3. Аналитика (Теперь она "видна" всем)
function updateAnalytics(data) {
  const top3List = document.getElementById("top3List");
  const canvas = document.getElementById("categoryChart");
  if (!top3List || !canvas) return;

  const counts = {};
  data.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

  top3List.innerHTML = Object.entries(counts)
    .sort((a,b) => b[1]-a[1]).slice(0,3)
    .map(([c, n]) => `<li><strong>${categoryLabel(c)}</strong>: ${n} шт.</li>`).join('');

  if (typeof Chart !== 'undefined') {
    const ctx = canvas.getContext("2d");
    if (window.catChart instanceof Chart) window.catChart.destroy();
    window.catChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts).map(categoryLabel),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#007bff', '#6610f2', '#28a745', '#ffc107', '#dc3545']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// 4. Основной рендер
function render() {
  if (!mapCanvas || !issueList) return;
  mapCanvas.querySelectorAll(".marker").forEach(m => m.remove());
  issueList.innerHTML = "";

  const catF = filterCategory?.value || "all";
  const statF = filterStatus?.value || "all";

  const visible = issues.filter(it => {
    return (catF === "all" || it.category === catF) && (statF === "all" || it.status === statF);
  });

  visible.forEach(it => {
    const marker = document.createElement("button");
    marker.className = "marker";
    marker.style.left = `${it.xPct * 100}%`;
    marker.style.top = `${it.yPct * 100}%`;
    if (activeId === it.id) marker.classList.add("active");
    marker.onclick = (e) => { e.stopPropagation(); setActive(it.id); };
    mapCanvas.appendChild(marker);
  });

  visible.forEach(it => {
    const item = document.createElement("div");
    item.className = `issue ${activeId === it.id ? 'active' : ''}`;
    item.innerHTML = `
      <div class="issue-top"><b>${categoryLabel(it.category)}</b> <span>${statusLabel(it.status)}</span></div>
      <div class="issue-desc">${it.desc}</div>
      <div class="issue-actions">
        <button onclick="cycleStatus('${it.id}')">Статус</button>
        <button onclick="removeIssue('${it.id}')">Удалить</button>
      </div>`;
    item.onclick = () => setActive(it.id);
    issueList.appendChild(item);
  });

  if (statsLine) statsLine.textContent = `Показано: ${visible.length} из ${issues.length}`;

  // Вызываем аналитику по ВСЕМ данным
  updateAnalytics(issues);
}

// 5. Управление данными (Global functions)
window.setActive = (id) => { activeId = id; render(); };

window.cycleStatus = (id) => {
  const it = issues.find(x => x.id === id);
  if (it) {
    const order = ["new", "work", "done"];
    it.status = order[(order.indexOf(it.status) + 1) % order.length];
    saveIssues(); render();
  }
};

window.removeIssue = (id) => {
  if (confirm("Удалить?")) { issues = issues.filter(x => x.id !== id); saveIssues(); render(); }
};

// 6. Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
  // Тестовые данные, если пусто
  if (issues.length === 0) {
    issues = [
      { id: '1', category: 'roads', status: 'new', desc: 'Яма на дороге', xPct: 0.3, yPct: 0.4 },
      { id: '2', category: 'trash', status: 'work', desc: 'Не вывезли мусор', xPct: 0.6, yPct: 0.2 }
    ];
    saveIssues();
  }

  // События
  btnAddIssue?.addEventListener("click", () => { modal.classList.add("show"); addMode = true; });

  document.querySelectorAll("[data-close]").forEach(el => el.onclick = () => { modal.classList.remove("show"); addMode = false; });

  mapCanvas?.addEventListener("click", (e) => {
    if (!addMode) return;
    const rect = mapCanvas.getBoundingClientRect();
    pickedPoint = { xPct: (e.clientX - rect.left) / rect.width, yPct: (e.clientY - rect.top) / rect.height };
    coordsView.textContent = "Точка выбрана!";
    btnSave.disabled = false;
  });

  btnSave?.addEventListener("click", () => {
    issues.unshift({ id: uid(), category: issueCategory.value, status: issueStatus.value, desc: issueDesc.value, ...pickedPoint });
    saveIssues(); modal.classList.remove("show"); addMode = false; render();
  });

  [filterCategory, filterStatus].forEach(f => f?.addEventListener("change", render));

  render();
});

document.addEventListener("DOMContentLoaded", () => {

/* ==============================
   Ashyq Qala — Final Fix
================================= */

const LS_KEY = "ashyq_qala_issues_v1";
let issues = loadIssues();
let addMode = false;
let pickedPoint = null;

// Элементы
const mapCanvas = document.getElementById("mapCanvas");
const issueModal = document.getElementById("issueModal");
const btnSaveIssue = document.getElementById("btnSaveIssue");
const coordsView = document.getElementById("coordsView");

function loadIssues() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveIssues() {
    localStorage.setItem(LS_KEY, JSON.stringify(issues));
}
// --- FAQ Логика ---
  // Находим все вопросы и вешаем событие клика
  document.querySelectorAll(".faq-question").forEach(q => {
    q.addEventListener("click", () => {
      // Ищем ближайшего родителя с классом .faq-item
      const item = q.closest('.faq-item');
      if (item) {
        item.classList.toggle("open");
      }
    });
  });
});
if (btnClearAll) {
    btnClearAll.addEventListener("click", () => {
      // 1. Спрашиваем подтверждение, чтобы не удалить случайно
      if (confirm("Вы уверены, что хотите удалить ВСЕ метки? Это действие нельзя отменить.")) {

        // 2. Очищаем массив в памяти
        issues = [];

        // 3. Сохраняем пустой массив в LocalStorage
        saveIssues();

        // 4. Перерисовываем карту и список (теперь они станут пустыми)
        render();

        // 5. Обнуляем график аналитики
        updateAnalytics(issues);

        console.log("Карта успешно очищена");
      }
    });
  }