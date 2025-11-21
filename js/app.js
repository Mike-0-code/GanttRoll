// ===== LOCALSTORAGE =====
function saveToStorage() {
    const projectData = {
        tasks: tasks,
        currentScale: currentScale,
        currentStartDate: currentStartDate.toISOString(),
        projectName: projectName,
        version: '1.0'
    };
    localStorage.setItem('ganttroll-data', JSON.stringify(projectData));
}

function loadFromStorage() {
    const saved = localStorage.getItem('ganttroll-data');
    if (saved) {
        try {
            const projectData = JSON.parse(saved);
            
            if (projectData.tasks && Array.isArray(projectData.tasks)) {
                tasks = projectData.tasks;
            }
            
            if (projectData.currentScale && scales[projectData.currentScale]) {
                currentScale = projectData.currentScale;
            }
            
            if (projectData.currentStartDate) {
                currentStartDate = new Date(projectData.currentStartDate);
            }

            if (projectData.projectName) {
                projectName = projectData.projectName;
                document.getElementById('project-name-input').innerText = projectName;
            }

            updateScaleButtons();
            updateProjectCharCounter();
            
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// ===== FUNCIÓN PARA ACTUALIZAR BOTONES DE ESCALA =====
function updateScaleButtons() {
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-scale="${currentScale}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ===== ESTADO GLOBAL =====
let currentScale = 'days';
let currentStartDate = new Date();
let draggingTaskId = null;
let taskToDelete = null;
let projectName = "Mi Proyecto";

// Ajustar al inicio de la semana (lunes)
currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay() + 1);

// Datos de las tareas
let tasks = [
    { 
        id: 1, 
        name: "Diseño UI/UX", 
        color: '#6366f1',
        scaleStates: {
            days: { startOffset: 0, duration: 4 },
            weeks: { startOffset: 0, duration: 1 },
            months: { startOffset: 0, duration: 1 }
        }
    },
    { 
        id: 2, 
        name: "Desarrollo Frontend", 
        color: '#10b981',
        scaleStates: {
            days: { startOffset: 3, duration: 7 },
            weeks: { startOffset: 1, duration: 2 },
            months: { startOffset: 0, duration: 1 }
        }
    },
    { 
        id: 3, 
        name: "Testing QA", 
        color: '#f59e0b',
        scaleStates: {
            days: { startOffset: 8, duration: 3 },
            weeks: { startOffset: 2, duration: 1 },
            months: { startOffset: 0, duration: 1 }
        }
    }
];

// Configuración de escalas
const scales = {
    days: { 
        unit: 'day', 
        unitsToShow: 14,
        navigate: (date, direction) => {
            const newDate = new Date(date);
            newDate.setDate(date.getDate() + (direction * 14));
            return newDate;
        }
    },
    weeks: { 
        unit: 'week', 
        unitsToShow: 12,
        navigate: (date, direction) => {
            const newDate = new Date(date);
            newDate.setDate(date.getDate() + (direction * 84));
            return newDate;
        }
    },
    months: { 
        unit: 'month', 
        unitsToShow: 6,
        navigate: (date, direction) => {
            const newDate = new Date(date);
            newDate.setMonth(date.getMonth() + (direction * 6));
            return newDate;
        }
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadFromStorage();
    setupEventListeners();
    setupInfoTooltip(); 
    renderTimeline();
});

// ===== EXPORTACIÓN A PNG =====
async function exportToPNG() {
    const exportBtn = document.querySelector('.export-btn');
    const originalText = exportBtn.innerHTML;
    
    try {
        // Cambiar estado del botón
        exportBtn.disabled = true;
        exportBtn.classList.add('exporting');
        exportBtn.innerHTML = '⏳ Generando...';
        
        // Crear el clon del diagrama
        const clone = await createExpandedClone();
        
        // Generar la imagen
        const canvas = await html2canvas(clone, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-secondary'),
            scale: 2, // Mejor calidad
            useCORS: true,
            allowTaint: true,
            logging: false
        });
        
        // Convertir a PNG y descargar
        const link = document.createElement('a');
        link.download = `GanttRoll-${projectName}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Limpiar
        document.body.removeChild(clone);
        
    } catch (error) {
        console.error('Error al exportar:', error);
        alert('Error al generar la imagen. Intenta nuevamente.');
    } finally {
        // Restaurar botón
        exportBtn.disabled = false;
        exportBtn.classList.remove('exporting');
        exportBtn.innerHTML = originalText;
    }
}

function createExpandedClone() {
    return new Promise((resolve) => {
        // Clonar el contenedor principal
        const original = document.querySelector('.gantt-timeline');
        const clone = original.cloneNode(true);
        
        // Estilos para expandir el clon
        clone.style.position = 'fixed';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.width = original.offsetWidth + 'px';
        clone.style.height = 'auto';
        clone.style.overflow = 'visible';
        clone.style.zIndex = '-1000';
        clone.style.opacity = '0.99'; // Para forzar renderizado
        
        // Remover cualquier limitación de altura máxima
        clone.style.maxHeight = 'none';
        clone.style.minHeight = 'auto';
        
        // Agregar al documento (fuera de pantalla)
        document.body.appendChild(clone);
        
        // Pequeño delay para asegurar renderizado
        setTimeout(() => resolve(clone), 100);
    });
}

// ===== GESTIÓN DE TEMA =====
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('ganttroll-theme');
    
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', handleThemeChange);
}

function handleThemeChange(e) {
    if (e.target.checked) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('ganttroll-theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('ganttroll-theme', 'dark');
    }
}

// ===== CONFIGURACIÓN DE EVENTOS =====
function setupEventListeners() {
    // Botones principales
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('prev-date-btn').addEventListener('click', () => changeDateRange(-1));
    document.getElementById('next-date-btn').addEventListener('click', () => changeDateRange(1));
    document.getElementById('today-btn').addEventListener('click', goToToday);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    
    const projectNameInput = document.getElementById('project-name-input');
    projectNameInput.addEventListener('blur', updateProjectName);
    projectNameInput.addEventListener('keydown', handleProjectNameKeydown);
    projectNameInput.addEventListener('input', handleProjectNameInput);

    
    // Botones de escala
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            changeScale(e.target.dataset.scale);
        });
    });

    // Redibujar en resize
    window.addEventListener('resize', renderTimeline);
}

// ===== GESTIÓN DEL NOMBRE DEL PROYECTO =====
function updateProjectName() {
    const projectNameInput = document.getElementById('project-name-input');
    const newName = projectNameInput.innerText.trim();
    
    if (newName !== '') {
        projectName = newName;
        saveToStorage();
        updateProjectCharCounter();
    } else {
        // Si está vacío, restaurar el nombre anterior
        projectNameInput.innerText = projectName;
    }
}

function handleProjectNameInput(event) {
    const maxLength = 50;
    const currentLength = event.target.innerText.length;
    const counter = document.querySelector('.project-char-counter');
    
    counter.textContent = `${currentLength}/${maxLength}`;
    
    if (currentLength >= maxLength && event.inputType === 'insertText') {
        event.preventDefault();
        event.target.innerText = event.target.innerText.substring(0, maxLength);
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(event.target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function handleProjectNameKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

function updateProjectCharCounter() {
    const counter = document.querySelector('.project-char-counter');
    counter.textContent = `${projectName.length}/50`;
}

// ===== INFORMACIÓN DE ALMACENAMIENTO =====
function setupInfoTooltip() {
    const infoBtn = document.querySelector('.info-btn');
    const tooltip = document.createElement('div');
    
    tooltip.className = 'info-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-title">Almacenamiento Local</div>
        <div class="tooltip-text">
            Tus tareas se guardan automáticamente en este navegador. 
            Si limpias el historial o cambias de navegador, se reiniciará el tablero.
        </div>
        <div class="tooltip-note">
            Solo visible para ti en este dispositivo
        </div>
    `;
    
    document.querySelector('.header-actions').appendChild(tooltip);
    
    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        tooltip.classList.toggle('show');
    });
    
    // Cerrar tooltip
    document.addEventListener('click', () => tooltip.classList.remove('show'));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') tooltip.classList.remove('show');
    });
}

// ===== UTILIDADES =====
function getScaleContainerWidth() {
    const timeScale = document.getElementById('time-scale');
    return timeScale ? timeScale.offsetWidth : 0;
}

function getUnitWidth() {
    const scale = scales[currentScale];
    const containerWidth = getScaleContainerWidth();
    return containerWidth / scale.unitsToShow;
}

function getRandomColor() {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    
    const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
    
    if (weekNum > 52) {
        const nextYear = new Date(date.getFullYear(), 11, 31);
        const dayNrNext = (nextYear.getDay() + 6) % 7;
        nextYear.setDate(nextYear.getDate() - dayNrNext + 3);
        
        const firstThursdayNext = nextYear.valueOf();
        nextYear.setMonth(0, 1);
        
        if (nextYear.getDay() !== 4) {
            nextYear.setMonth(0, 1 + ((4 - nextYear.getDay()) + 7) % 7);
        }
        
        if (firstThursdayNext - nextYear < 604800000) {
            return 1;
        }
    }
    
    return weekNum;
}

// ===== FUNCIONES PRINCIPALES =====
function changeScale(scale) {
    currentScale = scale;
    updateScaleButtons();
    renderTimeline();
    saveToStorage();
}

function changeDateRange(direction) {
    const scale = scales[currentScale];
    currentStartDate = scale.navigate(currentStartDate, direction);
    renderTimeline();
    saveToStorage();
}

function goToToday() {
    currentStartDate = new Date();
    if (currentScale === 'days') {
        currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay() + 1);
    }
    renderTimeline();
    saveToStorage();
}

function addTask() {
    const scaleState = {
        days: { startOffset: 0, duration: 3 },
        weeks: { startOffset: 0, duration: 1 },
        months: { startOffset: 0, duration: 1 }
    };

    const newTask = {
        id: Date.now(),
        name: `Tarea ${tasks.length + 1}`,
        color: getRandomColor(),
        scaleStates: scaleState
    };
    
    tasks.push(newTask);
    renderTimeline();
    saveToStorage();
}

function updateTaskColor(taskId, color) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.color = color;
        renderTimeline();
        saveToStorage();
    }
}

function updateTaskName(taskId, newName) {
    const task = tasks.find(t => t.id === taskId);
    if (task && newName.trim() !== '') {
        task.name = newName.trim();
        renderTimeline();
        saveToStorage();
    }
}

function handleTaskNameInput(event, taskId) {
    const maxLength = 30;
    const currentLength = event.target.innerText.length;
    const counter = event.target.nextElementSibling;
    
    counter.textContent = `${currentLength}/${maxLength}`;
    
    if (currentLength >= maxLength && event.inputType === 'insertText') {
        event.preventDefault();
        event.target.innerText = event.target.innerText.substring(0, maxLength);
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(event.target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function handleTaskNameKeydown(event, taskId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

// ===== SISTEMA DE RENDERIZADO =====
function renderTimeline() {
    renderTimeScale();
    renderTasks();
    updateDateRangeDisplay();
}

function renderTimeScale() {
    const scale = scales[currentScale];
    const container = document.getElementById('time-scale');
    container.innerHTML = '';
    container.style.display = 'flex';

    for (let i = 0; i < scale.unitsToShow; i++) {
        const date = new Date(currentStartDate);
        if (scale.unit === 'day') {
            date.setDate(currentStartDate.getDate() + i);
        } else if (scale.unit === 'week') {
            date.setDate(currentStartDate.getDate() + (i * 7));
        } else {
            date.setMonth(currentStartDate.getMonth() + i);
        }

        const unit = document.createElement('div');
        unit.className = 'time-unit';
        
        if (scale.unit === 'day') {
            unit.textContent = date.getDate();
            if (date.getDay() === 1) unit.classList.add('marker');
            if (date.getDay() === 0 || date.getDay() === 6) unit.classList.add('weekend');
        } else if (scale.unit === 'week') {
            const weekNumber = getWeekNumber(date);
            unit.textContent = `S${weekNumber}`;
        } else {
            unit.textContent = date.toLocaleDateString('es-ES', { month: 'short' });
        }
        
        container.appendChild(unit);
    }
}

function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        container.appendChild(taskElement);
    });
}

function createTaskElement(task, index) {
    const scale = scales[currentScale];
    const row = document.createElement('div');
    row.className = 'task-row';
    row.setAttribute('data-task-id', task.id);
    row.setAttribute('data-task-index', index);

    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';
    taskInfo.innerHTML = `
        <div class="drag-handle" draggable="true" data-task-id="${task.id}">⋮⋮</div>
        <input type="color" class="color-picker" value="${task.color}" 
               onchange="updateTaskColor(${task.id}, this.value)">
        <div class="task-name" contenteditable="true" 
             onblur="updateTaskName(${task.id}, this.innerText)"
             onkeydown="handleTaskNameKeydown(event, ${task.id})"
             oninput="handleTaskNameInput(event, ${task.id})">${task.name}</div>
        <div class="char-counter">${task.name.length}/30</div>
        <button class="delete-btn" onclick="openDeleteModal(${task.id})">×</button>
    `;

    setupVerticalDrag(taskInfo.querySelector('.drag-handle'), task, row);

    const barContainer = document.createElement('div');
    barContainer.className = 'task-bar-container';

    const scaleState = task.scaleStates[currentScale];
    const unitWidth = getUnitWidth();
    
    const taskBar = document.createElement('div');
    taskBar.className = 'task-bar';
    taskBar.textContent = task.name;
    taskBar.style.background = task.color;
    taskBar.style.left = `${scaleState.startOffset * unitWidth}px`;
    taskBar.style.width = `${scaleState.duration * unitWidth}px`;

    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle right';
    rightHandle.addEventListener('mousedown', (e) => startResize(e, task, 'right'));

    taskBar.appendChild(rightHandle);
    setupTaskDrag(taskBar, task);

    barContainer.appendChild(taskBar);
    row.appendChild(taskInfo);
    row.appendChild(barContainer);

    return row;
}

// ===== SISTEMA DE ELIMINACIÓN =====
function openDeleteModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        taskToDelete = taskId;
        document.getElementById('delete-task-name').textContent = 
            `¿Estás seguro de que quieres eliminar la tarea "${task.name}"? Esta acción no se puede deshacer.`;
        document.getElementById('delete-modal').style.display = 'flex';
    }
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    taskToDelete = null;
}

function confirmDelete() {
    if (taskToDelete) {
        tasks = tasks.filter(t => t.id !== taskToDelete);
        renderTimeline();
        closeDeleteModal();
        saveToStorage();
    }
}

// ===== DRAG & DROP =====
function setupVerticalDrag(dragHandle, task, row) {
    dragHandle.addEventListener('dragstart', (e) => {
        draggingTaskId = task.id;
        row.classList.add('dragging-vertical');
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
    });

    dragHandle.addEventListener('dragend', () => {
        draggingTaskId = null;
        document.querySelectorAll('.task-row').forEach(r => {
            r.classList.remove('dragging-vertical', 'drop-zone');
        });
    });

    row.addEventListener('dragover', (e) => {
        if (draggingTaskId && draggingTaskId !== task.id) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            row.classList.add('drop-zone');
        }
    });

    row.addEventListener('dragleave', () => {
        row.classList.remove('drop-zone');
    });

    row.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggingTaskId && draggingTaskId !== task.id) {
            moveTaskToPosition(draggingTaskId, task.id);
        }
        row.classList.remove('drop-zone');
    });
}

function moveTaskToPosition(draggingId, targetId) {
    const draggingIndex = tasks.findIndex(t => t.id === draggingId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);
    
    if (draggingIndex === -1 || targetIndex === -1) return;
    
    const [draggingTask] = tasks.splice(draggingIndex, 1);
    tasks.splice(targetIndex, 0, draggingTask);
    renderTimeline();
    saveToStorage();
}

function setupTaskDrag(element, task) {
    let startX, startLeft;

    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) return;
        
        startX = e.clientX;
        const unitWidth = getUnitWidth();
        startLeft = parseInt(element.style.left);
        element.classList.add('dragging');

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            const scale = scales[currentScale];
            const scaleState = task.scaleStates[currentScale];
            
            const maxLeft = (scale.unitsToShow - scaleState.duration) * unitWidth;
            const newLeft = Math.max(0, Math.min(maxLeft, startLeft + deltaX));
            const newStartOffset = newLeft / unitWidth;
            
            task.scaleStates[currentScale].startOffset = newStartOffset;
            renderTimeline();
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.classList.remove('dragging');
            saveToStorage();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function startResize(e, task, direction) {
    e.stopPropagation();
    const scale = scales[currentScale];
    const scaleState = task.scaleStates[currentScale];
    let startX = e.clientX;
    let startDuration = scaleState.duration;
    let startOffset = scaleState.startOffset;

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const unitWidth = getUnitWidth();
        const deltaUnits = deltaX / unitWidth;

        if (direction === 'right') {
            const maxDuration = scale.unitsToShow - startOffset;
            const newDuration = Math.max(1, Math.min(maxDuration, startDuration + deltaUnits));
            task.scaleStates[currentScale].duration = newDuration;
        }
        
        renderTimeline();
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        saveToStorage();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// ===== VISUALIZACIÓN DE FECHAS =====
function updateDateRangeDisplay() {
    const scale = scales[currentScale];
    let displayText = '';
    let timelineTitle = '';

    if (scale.unit === 'day') {
        const endDate = new Date(currentStartDate);
        endDate.setDate(currentStartDate.getDate() + scale.unitsToShow - 1);
        
        displayText = `${formatDate(currentStartDate)} - ${formatDate(endDate)}`;
        timelineTitle = currentStartDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
    } else if (scale.unit === 'week') {
        const endDate = new Date(currentStartDate);
        endDate.setDate(currentStartDate.getDate() + (scale.unitsToShow * 7) - 1);
        
        const startWeek = getWeekNumber(currentStartDate);
        const endWeek = getWeekNumber(endDate);
        displayText = `S${startWeek} - S${endWeek}`;
        timelineTitle = getMonthRangeTitle(currentStartDate, endDate);
        
    } else {
        const endDate = new Date(currentStartDate);
        endDate.setMonth(currentStartDate.getMonth() + scale.unitsToShow - 1);
        
        displayText = getCompactMonthRange(currentStartDate, endDate);
        timelineTitle = `${currentStartDate.getFullYear()} - ${endDate.getFullYear()}`;
    }

    document.getElementById('current-range').textContent = displayText;
    document.getElementById('timeline-title').textContent = timelineTitle;
}

function getCompactMonthRange(startDate, endDate) {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    if (startYear === endYear) {
        const startMonth = startDate.toLocaleDateString('es-ES', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('es-ES', { month: 'short' });
        return `${startMonth} - ${endMonth} ${startYear}`;
    } else {
        const startStr = startDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        const endStr = endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    }
}

function getMonthRangeTitle(startDate, endDate) {
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else {
        return `${startDate.toLocaleDateString('es-ES', { month: 'long' })} - ${endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    }
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
