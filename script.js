// Global State
let currentPage = 'home';
let currentRoomType = 'living-room';
let furniture = [];
let selectedItemId = null;
let wallColor = '#f5f5f5';
let floorColor = '#d8c3a5';
let lighting = 'daylight';
let snapToGrid = false;
let zoom = 1;
let pan = { x: 0, y: 0 };
let isDarkMode = false;
let history = [];
let historyIndex = -1;
let isDrawing = false;
let dragOffset = { x: 0, y: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

// Canvas
let canvas;
let ctx;

// Color Palettes
const wallColors = [
    '#f5f5f5', '#f8e8e8', '#e8f4f8', '#f0f8e8', '#fef7e7', '#f3e8ff',
    '#e6f3ff', '#fff5e6', '#e8fff8', '#ffe8f0', '#f0e6ff', '#e6fff0',
    '#d8c3a5', '#c6d8d3', '#e98074', '#dbb2ab', '#a8d8ea', '#c4a484',
    '#b8a9c9', '#c9ada7', '#a2c2e4', '#e4c1c4', '#c1e4c1', '#f4e4bc'
];

const furnitureColors = [
    '#d8c3a5', '#e98074', '#c6d8d3', '#8e8d8a', '#f5f5f5', '#333333',
    '#dbb2ab', '#a8d8ea', '#c4a484', '#b8a9c9', '#c9ada7', '#a2c2e4',
    '#e4c1c4', '#c1e4c1', '#f4e4bc', '#e6b3ba', '#b3e6ff', '#e6ffb3',
    '#ffb3e6', '#b3ffe6', '#c2b3e6', '#e6c2b3', '#b3c2e6', '#e6e6b3'
];

// Room Images for Hero Rotation
const roomImages = [
    {
        image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=800&q=80",
        name: "Living Room"
    },
    {
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80", 
        name: "Bedroom"
    },
    {
        image: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=800&q=80",
        name: "Dining Room"
    }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    startHeroImageRotation();
});

function initializeApp() {
    canvas = document.getElementById('designCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        setupCanvas();
        initializePlanner();
    }
    
    setupColorPalettes();
    generateAISuggestions();
    updateZoomDisplay();
}

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    
    if (pageId === 'plannerPage') {
        setTimeout(() => {
            if (canvas && ctx) {
                drawRoom();
            }
        }, 100);
    }
}

function goHome() {
    showPage('homePage');
}

// Room Selector
function showRoomSelector() {
    document.getElementById('roomSelector').classList.add('active');
}

function hideRoomSelector() {
    document.getElementById('roomSelector').classList.remove('active');
}

function startPlanner(roomType) {
    currentRoomType = roomType;
    initializeRoom(roomType);
    updatePlannerTitle(roomType);
    showPage('plannerPage');
    hideRoomSelector();
    
    setTimeout(() => {
        drawRoom();
        showToast('Welcome to your design studio!', 'Ready to create something amazing?');
    }, 100);
}

function updatePlannerTitle(roomType) {
    const title = roomType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') + ' Designer';
    document.getElementById('plannerTitle').textContent = title;
}

// Room Initialization
function initializeRoom(type) {
    furniture = [];
    selectedItemId = null;
    history = [];
    historyIndex = -1;
    
    switch (type) {
        case 'bedroom':
            wallColor = '#f8e8e8';
            floorColor = '#dbb2ab';
            lighting = 'warm';
            break;
        case 'kitchen':
            wallColor = '#f0f8e8';
            floorColor = '#c4a484';
            lighting = 'daylight';
            break;
        case 'dining-room':
            wallColor = '#fef7e7';
            floorColor = '#c9ada7';
            lighting = 'warm';
            break;
        case 'office':
            wallColor = '#e6f3ff';
            floorColor = '#a2c2e4';
            lighting = 'daylight';
            break;
        default:
            wallColor = '#f5f5f5';
            floorColor = '#d8c3a5';
            lighting = 'daylight';
    }
    
    updateLightingButtons();
}

// Hero Image Rotation
let currentImageIndex = 0;
function startHeroImageRotation() {
    const heroImage = document.getElementById('heroImage');
    const roomName = document.getElementById('roomName');
    
    if (!heroImage || !roomName) return;
    
    setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % roomImages.length;
        const currentRoom = roomImages[currentImageIndex];
        
        heroImage.style.opacity = '0';
        setTimeout(() => {
            heroImage.src = currentRoom.image;
            roomName.textContent = currentRoom.name;
            heroImage.style.opacity = '1';
        }, 500);
    }, 4000);
}

// Canvas Setup
function setupCanvas() {
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

// Canvas Event Handlers
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    const clickedItem = [...furniture].reverse().find(item => {
        const width = item.size.width * item.scale;
        const height = item.size.height * item.scale;
        const centerX = item.x + width / 2;
        const centerY = item.y + height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const angle = -item.rotation * Math.PI / 180;
        const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
        const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
        return localX >= -width/2 && localX <= width/2 && localY >= -height/2 && localY <= height/2;
    });
    
    selectedItemId = clickedItem ? clickedItem.id : null;
    updateSelectedControls();
    drawRoom();
}

function handleMouseDown(e) {
    if (e.button === 1) { // Middle mouse button for panning
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        return;
    }
    
    if (!selectedItemId) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    const item = furniture.find(f => f.id === selectedItemId);
    if (!item) return;
    
    const width = item.size.width * item.scale;
    const height = item.size.height * item.scale;
    const centerX = item.x + width / 2;
    const centerY = item.y + height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const angle = -item.rotation * Math.PI / 180;
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    if (localX >= -width/2 && localX <= width/2 && localY >= -height/2 && localY <= height/2) {
        isDrawing = true;
        dragOffset = { x: x - item.x, y: y - item.y };
    }
}

function handleMouseMove(e) {
    if (isPanning) {
        const dx = (e.clientX - panStart.x) / zoom;
        const dy = (e.clientY - panStart.y) / zoom;
        panStart = { x: e.clientX, y: e.clientY };
        pan.x += dx;
        pan.y += dy;
        drawRoom();
        return;
    }
    
    if (!isDrawing || !selectedItemId) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    furniture = furniture.map(item => {
        if (item.id === selectedItemId) {
            let newX = x - dragOffset.x;
            let newY = y - dragOffset.y;
            if (snapToGrid) {
                newX = Math.round(newX / 20) * 20;
                newY = Math.round(newY / 20) * 20;
            }
            return { ...item, x: newX, y: newY };
        }
        return item;
    });
    
    drawRoom();
}

function handleMouseUp(e) {
    if (isPanning) {
        isPanning = false;
        return;
    }
    
    if (isDrawing) {
        saveToHistory();
        isDrawing = false;
    }
}

function handleWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY / 500;
    zoom = Math.min(2, Math.max(0.5, zoom + delta));
    updateZoomDisplay();
    drawRoom();
}

// Drawing Functions
function drawRoom() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);
    
    // Apply lighting filter
    applyLightingFilter();
    
    // Draw grid if enabled
    if (snapToGrid) {
        drawGrid();
    }
    
    // Draw floor with gradient
    const floorGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
    floorGradient.addColorStop(0, floorColor);
    floorGradient.addColorStop(0.5, adjustBrightness(floorColor, -10));
    floorGradient.addColorStop(1, adjustBrightness(floorColor, -25));
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
    
    // Draw wall with gradient
    const wallGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 150);
    wallGradient.addColorStop(0, adjustBrightness(wallColor, 15));
    wallGradient.addColorStop(0.3, wallColor);
    wallGradient.addColorStop(1, adjustBrightness(wallColor, -5));
    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - 150);
    
    // Draw furniture
    furniture.forEach(item => {
        drawFurnitureItem(item);
    });
    
    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawFurnitureItem(item) {
    ctx.save();
    
    const width = item.size.width;
    const height = item.size.height;
    const centerX = item.x + (width * item.scale) / 2;
    const centerY = item.y + (height * item.scale) / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.scale(item.scale, item.scale);
    
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
    
    ctx.fillStyle = item.color;
    
    // Draw different furniture types
    switch (item.type) {
        case 'sofa':
            // Main body
            ctx.fillRect(-width/2, -height/2, width, height);
            // 3D depth effect
            ctx.fillStyle = adjustBrightness(item.color, -20);
            ctx.fillRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10);
            // Backrest
            ctx.fillStyle = adjustBrightness(item.color, -10);
            ctx.fillRect(-width/2 + 8, -height/2, width - 16, 20);
            break;
            
        case 'plant':
            // Pot
            ctx.fillStyle = adjustBrightness(item.color, -30);
            ctx.fillRect(-width/4, height/4, width/2, height/4);
            // Plant
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(0, -height/4, width/3, 0, 2 * Math.PI);
            ctx.fill();
            break;
            
        case 'tv':
            // Screen
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-width/2, -height/2, width, height * 0.7);
            // Stand
            ctx.fillStyle = item.color;
            ctx.fillRect(-width/6, height/4, width/3, height/4);
            break;
            
        case 'bookshelf':
            // Main structure
            ctx.fillRect(-width/2, -height/2, width, height);
            // Shelves
            ctx.fillStyle = adjustBrightness(item.color, -15);
            for (let i = 1; i < 4; i++) {
                const shelfY = -height/2 + (height/4) * i;
                ctx.fillRect(-width/2 + 3, shelfY, width - 6, 3);
            }
            break;
            
        case 'chair':
            ctx.fillRect(-width/2, -height/2, width, height);
            ctx.fillStyle = adjustBrightness(item.color, -15);
            ctx.fillRect(-width/2 + 3, -height/2, width - 6, 8);
            break;
            
        case 'table':
            // Table top
            ctx.fillRect(-width/2, -height/2, width, height);
            // Table legs
            ctx.fillStyle = adjustBrightness(item.color, -20);
            const legSize = 4;
            ctx.fillRect(-width/2 + 5, -height/2 + 5, legSize, height - 10);
            ctx.fillRect(width/2 - 5 - legSize, -height/2 + 5, legSize, height - 10);
            ctx.fillRect(-width/2 + 5, height/2 - 5 - legSize, width - 10, legSize);
            break;
            
        case 'bed':
            // Mattress
            ctx.fillRect(-width/2, -height/2, width, height);
            // Pillows
            ctx.fillStyle = adjustBrightness(item.color, 20);
            ctx.fillRect(-width/2 + 10, -height/2 + 5, 30, 15);
            ctx.fillRect(width/2 - 40, -height/2 + 5, 30, 15);
            break;
            
        case 'lamp':
            // Base
            ctx.fillRect(-width/4, height/4, width/2, height/4);
            // Pole
            ctx.fillRect(-2, -height/2, 4, height);
            // Shade
            ctx.fillStyle = adjustBrightness(item.color, 30);
            ctx.beginPath();
            ctx.arc(0, -height/3, width/3, 0, 2 * Math.PI);
            ctx.fill();
            break;
            
        default:
            ctx.fillRect(-width/2, -height/2, width, height);
    }
    
    ctx.shadowColor = 'transparent';
    
    // Selection highlight
    if (selectedItemId === item.id) {
        ctx.strokeStyle = '#e98074';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(-width/2 - 8, -height/2 - 8, width + 16, height + 16);
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

function applyLightingFilter() {
    let filter = '';
    if (isDarkMode) {
        filter = 'brightness(60%) contrast(1.2)';
    } else {
        switch (lighting) {
            case 'warm':
                filter = 'sepia(15%) saturate(110%) brightness(1.05)';
                break;
            case 'night':
                filter = 'brightness(70%) hue-rotate(240deg) contrast(1.1)';
                break;
            default:
                filter = 'brightness(1.05) contrast(1.05)';
        }
    }
    canvas.style.filter = filter;
}

function adjustBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Furniture Management
function addFurniture(type) {
    saveToHistory();
    
    let x = 100 + Math.random() * 200;
    let y = 100 + Math.random() * 200;
    
    if (snapToGrid) {
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
    }
    
    const newItem = {
        id: Date.now().toString(),
        type: type,
        x: x,
        y: y,
        rotation: 0,
        color: furnitureColors[Math.floor(Math.random() * furnitureColors.length)],
        size: getSizeForType(type),
        scale: 1
    };
    
    furniture.push(newItem);
    selectedItemId = newItem.id;
    updateSelectedControls();
    drawRoom();
    generateAISuggestions();
    
    showToast('Furniture Added', `${type.charAt(0).toUpperCase() + type.slice(1)} added with style!`);
}

function getSizeForType(type) {
    switch (type) {
        case 'sofa': return { width: 120, height: 60 };
        case 'chair': return { width: 45, height: 45 };
        case 'table': return { width: 90, height: 70 };
        case 'bed': return { width: 140, height: 90 };
        case 'lamp': return { width: 35, height: 35 };
        case 'plant': return { width: 40, height: 50 };
        case 'tv': return { width: 80, height: 50 };
        case 'bookshelf': return { width: 60, height: 100 };
        default: return { width: 50, height: 50 };
    }
}

// Item Controls
function moveItem(direction) {
    if (!selectedItemId) return;
    
    saveToHistory();
    const moveDistance = 10;
    
    furniture = furniture.map(item => {
        if (item.id === selectedItemId) {
            const newItem = { ...item };
            switch (direction) {
                case 'up':
                    newItem.y = Math.max(10, item.y - moveDistance);
                    break;
                case 'down':
                    newItem.y = Math.min(450, item.y + moveDistance);
                    break;
                case 'left':
                    newItem.x = Math.max(10, item.x - moveDistance);
                    break;
                case 'right':
                    newItem.x = Math.min(650, item.x + moveDistance);
                    break;
            }
            if (snapToGrid) {
                newItem.x = Math.round(newItem.x / 20) * 20;
                newItem.y = Math.round(newItem.y / 20) * 20;
            }
            return newItem;
        }
        return item;
    });
    
    drawRoom();
}

function rotateItem() {
    if (!selectedItemId) return;
    
    saveToHistory();
    furniture = furniture.map(item => 
        item.id === selectedItemId 
            ? { ...item, rotation: (item.rotation + 90) % 360 }
            : item
    );
    drawRoom();
}

function scaleItem(delta) {
    if (!selectedItemId) return;
    
    saveToHistory();
    furniture = furniture.map(item => 
        item.id === selectedItemId 
            ? { ...item, scale: Math.max(0.5, Math.min(2, item.scale + delta)) }
            : item
    );
    drawRoom();
}

function removeSelected() {
    if (!selectedItemId) return;
    
    saveToHistory();
    furniture = furniture.filter(item => item.id !== selectedItemId);
    selectedItemId = null;
    updateSelectedControls();
    drawRoom();
    generateAISuggestions();
    
    showToast('Furniture Removed', 'Selected furniture has been removed from your room.');
}

// Color Management
function setupColorPalettes() {
    setupWallColors();
    setupFloorColors();
    setupFurnitureColors();
}

function setupWallColors() {
    const container = document.getElementById('wallColors');
    if (!container) return;
    
    container.innerHTML = '';
    wallColors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.onclick = () => changeWallColor(color);
        if (color === wallColor) btn.classList.add('active');
        container.appendChild(btn);
    });
}

function setupFloorColors() {
    const container = document.getElementById('floorColors');
    if (!container) return;
    
    container.innerHTML = '';
    wallColors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.onclick = () => changeFloorColor(color);
        if (color === floorColor) btn.classList.add('active');
        container.appendChild(btn);
    });
}

function setupFurnitureColors() {
    const container = document.getElementById('furnitureColors');
    if (!container) return;
    
    container.innerHTML = '';
    furnitureColors.slice(0, 18).forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.onclick = () => changeFurnitureColor(color);
        container.appendChild(btn);
    });
}

function changeWallColor(color) {
    saveToHistory();
    wallColor = color;
    updateColorButtons('wallColors', color);
    drawRoom();
}

function changeFloorColor(color) {
    saveToHistory();
    floorColor = color;
    updateColorButtons('floorColors', color);
    drawRoom();
}

function changeFurnitureColor(color) {
    if (!selectedItemId) return;
    
    saveToHistory();
    furniture = furniture.map(item => 
        item.id === selectedItemId 
            ? { ...item, color }
            : item
    );
    drawRoom();
}

function updateColorButtons(containerId, activeColor) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.style.backgroundColor === activeColor) {
            btn.classList.add('active');
        }
    });
}

// Lighting Controls
function setLighting(newLighting) {
    saveToHistory();
    lighting = newLighting;
    updateLightingButtons();
    drawRoom();
}

function updateLightingButtons() {
    document.querySelectorAll('.lighting-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lighting === lighting) {
            btn.classList.add('active');
        }
    });
}

// View Controls
function toggleGrid() {
    snapToGrid = !snapToGrid;
    const btn = document.getElementById('gridToggle');
    if (btn) {
        btn.classList.toggle('active', snapToGrid);
    }
    drawRoom();
}

function zoomIn() {
    zoom = Math.min(2, zoom + 0.1);
    updateZoomDisplay();
    drawRoom();
}

function zoomOut() {
    zoom = Math.max(0.5, zoom - 0.1);
    updateZoomDisplay();
    drawRoom();
}

function updateZoomDisplay() {
    const display = document.getElementById('zoomLevel');
    if (display) {
        display.textContent = Math.round(zoom * 100) + '%';
    }
}

// Dark Mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
            lucide.createIcons();
        }
    }
    
    drawRoom();
}

// History Management
function saveToHistory() {
    const state = {
        furniture: JSON.parse(JSON.stringify(furniture)),
        wallColor,
        floorColor,
        lighting
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    history = newHistory;
    historyIndex = newHistory.length - 1;
}

function undo() {
    if (historyIndex > 0) {
        const prevState = history[historyIndex - 1];
        furniture = prevState.furniture;
        wallColor = prevState.wallColor;
        floorColor = prevState.floorColor;
        lighting = prevState.lighting;
        historyIndex--;
        
        selectedItemId = null;
        updateSelectedControls();
        setupColorPalettes();
        updateLightingButtons();
        drawRoom();
        
        showToast('Undone', 'Previous action has been undone.');
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        furniture = nextState.furniture;
        wallColor = nextState.wallColor;
        floorColor = nextState.floorColor;
        lighting = nextState.lighting;
        historyIndex++;
        
        selectedItemId = null;
        updateSelectedControls();
        setupColorPalettes();
        updateLightingButtons();
        drawRoom();
        
        showToast('Redone', 'Action has been redone.');
    }
}

// AI Suggestions
function generateAISuggestions() {
    const container = document.getElementById('suggestionsList');
    const section = document.getElementById('aiSuggestions');
    if (!container || !section) return;
    
    const suggestions = [];
    
    if (furniture.length === 0) {
        suggestions.push({
            title: 'Start with essentials',
            description: `Add key furniture for your ${currentRoomType.replace('-', ' ')}`,
            action: () => suggestLayout()
        });
    }
    
    if (furniture.length > 0 && furniture.length < 3) {
        suggestions.push({
            title: 'Complete the layout',
            description: 'Add complementary furniture and decor',
            action: () => suggestLayout()
        });
    }
    
    if (wallColor === '#f5f5f5') {
        suggestions.push({
            title: 'Add personality',
            description: 'Try a warmer wall color for more character',
            action: () => {
                changeWallColor('#f8e8e8');
            }
        });
    }
    
    if (suggestions.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    container.innerHTML = '';
    
    suggestions.slice(0, 3).forEach(suggestion => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
            <h4>${suggestion.title}</h4>
            <p>${suggestion.description}</p>
        `;
        card.onclick = suggestion.action;
        container.appendChild(card);
    });
}

function suggestLayout() {
    saveToHistory();
    
    const roomLayouts = {
        'living-room': [
            { type: 'sofa', x: 150, y: 200, color: '#c6d8d3' },
            { type: 'table', x: 180, y: 280, color: '#d8c3a5' },
            { type: 'chair', x: 300, y: 220, color: '#e98074' },
            { type: 'lamp', x: 120, y: 180, color: '#8e8d8a' },
            { type: 'plant', x: 350, y: 150, color: '#c1e4c1' }
        ],
        'bedroom': [
            { type: 'bed', x: 200, y: 150, color: '#dbb2ab' },
            { type: 'lamp', x: 150, y: 130, color: '#b8a9c9' },
            { type: 'lamp', x: 300, y: 130, color: '#b8a9c9' },
            { type: 'chair', x: 120, y: 250, color: '#c9ada7' }
        ],
        'kitchen': [
            { type: 'table', x: 200, y: 200, color: '#c4a484' },
            { type: 'chair', x: 170, y: 170, color: '#a8d8ea' },
            { type: 'chair', x: 230, y: 170, color: '#a8d8ea' },
            { type: 'plant', x: 300, y: 180, color: '#c1e4c1' }
        ],
        'office': [
            { type: 'table', x: 200, y: 200, color: '#a2c2e4' },
            { type: 'chair', x: 200, y: 230, color: '#e4c1c4' },
            { type: 'bookshelf', x: 120, y: 150, color: '#c2b3e6' },
            { type: 'lamp', x: 180, y: 180, color: '#8e8d8a' }
        ]
    };
    
    const layout = roomLayouts[currentRoomType] || roomLayouts['living-room'];
    
    layout.forEach((item, index) => {
        setTimeout(() => {
            const newItem = {
                id: Date.now().toString() + index,
                type: item.type,
                x: item.x,
                y: item.y,
                rotation: 0,
                color: item.color,
                size: getSizeForType(item.type),
                scale: 1
            };
            
            furniture.push(newItem);
            drawRoom();
            generateAISuggestions();
        }, index * 500);
    });
    
    showToast('AI Layout Applied!', 'Your room has been furnished with AI suggestions.');
}

// UI Updates
function updateSelectedControls() {
    const container = document.getElementById('selectedControls');
    if (!container) return;
    
    if (selectedItemId) {
        container.style.display = 'block';
        setupFurnitureColors();
    } else {
        container.style.display = 'none';
    }
}

function initializePlanner() {
    if (!canvas) return;
    
    // Initialize default state
    saveToHistory();
    setupColorPalettes();
    updateSelectedControls();
    generateAISuggestions();
    drawRoom();
}

// Toast Notifications
function showToast(title, description, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <h4>${title}</h4>
        <p>${description}</p>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize icons after DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});


  async function downloadPDF() {
    const { jsPDF } = window.jspdf;

    const element = document.getElementById('design-area');

    // Convert the design area to canvas
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2 // increase for better resolution
    });

    const imgData = canvas.toDataURL('image/png');

    // Create PDF with matching dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('HueHaus_Room_Design.pdf');
  }

