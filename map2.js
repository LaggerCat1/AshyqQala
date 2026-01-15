/* ==============================
   Ashyq Qala — Исправленная версия
================================= */

// Глобальные переменные
let issues = loadIssues();
let addMode = false;
let pickedPoint = null; 

// Элементы DOM
const mapCanvas = document.getElementById("mapCanvas");
const btnSaveIssue = document.getElementById("btnSaveIssue");
const coordsView = document.getElementById("coordsView");
const issueModal = document.getElementById("issueModal");

/**
 * Рендерит графики и аналитику. 
 * Вынесена в корень, чтобы редактор её видел.
 */
function updateAnalytics(data) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas || typeof Chart === 'undefined') return;

    const counts = {};
    data.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

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

/**
 * Основная функция отрисовки
 */
function render() {
    // ... твой код очистки и отрисовки маркеров ...
    
    // В конце вызываем аналитику
    updateAnalytics(issues);
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

    // Логика FAQ (проверь, что классы совпадают)
    document.querySelectorAll(".faq-question").forEach(q => {
        q.onclick = () => {
            q.closest('.faq-item')?.classList.toggle("open");
        };
    });

    render();
});