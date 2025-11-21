// Estado global de la aplicación
let currentScale = 'days';
let currentStartDate = new Date();
let draggingTaskId = null;
let taskToDelete = null;

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

// Función para obtener el ancho real del contenedor de escala
function getScaleContainerWidth() {
    const timeScale = document.getElementById('time-scale');
    return timeScale ? timeScale.offsetWidth : 0;
}

// Función para calcular el ancho de unidad basado en el ancho real del contenedor
function getUnitWidth() {
    const scale = scales[currentScale];
    const containerWidth = getScaleContainerWidth();
    return containerWidth / scale.unitsToShow;
}

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para botones
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('prev-date-btn').addEventListener('click', () => changeDateRange(-1));
    document.getElementById('next-date-btn').addEventListener('click', () => changeDateRange(1));
    document.getElementById('today-btn').addEventListener('click', goToToday);
    document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    
    // Event listeners para botones de escala
    document.querySelectorAll('.scale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            changeScale(e.target.dataset.scale);
        });
    });

    // Redibujar cuando cambia el tamaño de la ventana
    window.addEventListener('resize', renderTimeline);
    
    renderTimeline();
});

// Función corregida para cálculo de semanas ISO
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

// Funciones principales de la aplicación
function changeScale(scale) {
    currentScale = scale;
    document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-scale="${scale}"]`).classList.add('active');
    renderTimeline();
}

function changeDateRange(direction) {
    const scale = scales[currentScale];
    currentStartDate = scale.navigate(currentStartDate, direction);
    renderTimeline();
}

function goToToday() {
    currentStartDate = new Date();
    if (currentScale === 'days') {
        currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay() + 1);
    }
    renderTimeline();
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
}

function getRandomColor() {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function updateTaskColor(taskId, color) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.color = color;
        renderTimeline();
    }
}

function updateTaskName(taskId, newName) {
    const task = tasks.find(t => t.id === taskId);
    if (task && newName.trim() !== '') {
        task.name = newName.trim();
        renderTimeline();
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

// Sistema de renderizado
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

    const dragHandle = taskInfo.querySelector('.drag-handle');
    setupVerticalDrag(dragHandle, task, row);

    const barContainer = document.createElement('div');
    barContainer.className = 'task-bar-container';

    const scaleState = task.scaleStates[currentScale];
    const startOffset = scaleState.startOffset;
    const duration = scaleState.duration;

    const taskBar = document.createElement('div');
    taskBar.className = 'task-bar';
    taskBar.textContent = task.name;
    taskBar.style.background = task.color;
    
    // CALCULAR POSICIÓN Y ANCHO USANDO EL ANCHO REAL
    const unitWidth = getUnitWidth();
    taskBar.style.left = `${startOffset * unitWidth}px`;
    taskBar.style.width = `${duration * unitWidth}px`;

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

function handleTaskNameKeydown(event, taskId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

// Sistema de eliminación de tareas
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
    }
}

// Sistema de drag & drop
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
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Sistema de visualización de fechas
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
        timelineTitle = getMonthRangeTitle(currentStartDate,
