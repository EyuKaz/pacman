const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Game state
let score = 0;
let pacmanX = 224;
let pacmanY = 360;
let pacmanDirection = 0;
let mouthOpen = true;
let gameRunning = false;
let currentKey = null;
const CELL_SIZE = 16;
const SPEED = 2;

// Ghost class with proper movement
class Ghost {
    constructor(color, x, y) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.direction = Math.floor(Math.random() * 4);
        this.speed = SPEED - 0.5;
    }

    move() {
        const directions = [
            {dx: this.speed, dy: 0},  // right
            {dx: -this.speed, dy: 0}, // left
            {dx: 0, dy: -this.speed}, // up
            {dx: 0, dy: this.speed}   // down
        ];
        
        // Try current direction first
        let newX = this.x + directions[this.direction].dx;
        let newY = this.y + directions[this.direction].dy;
        
        if (!checkWallCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return;
        }
        
        // If blocked, choose random new direction
        const validDirections = [];
        for (let dir = 0; dir < 4; dir++) {
            newX = this.x + directions[dir].dx;
            newY = this.y + directions[dir].dy;
            if (!checkWallCollision(newX, newY)) {
                validDirections.push(dir);
            }
        }
        
        if (validDirections.length > 0) {
            this.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
            this.x += directions[this.direction].dx;
            this.y += directions[this.direction].dy;
        }
    }
}

let ghosts = [
    new Ghost('red', 224, 160),
    new Ghost('pink', 192, 160),
    new Ghost('cyan', 256, 160),
    new Ghost('orange', 224, 192)
];

// Complete maze layout
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,0,0,0,1,1,1,1,1,1,1,1,0,0,0,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
    [1,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Input handling
function handleKeyDown(e) {
    if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        currentKey = e.key;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', () => currentKey = null);

function drawPacman() {
    ctx.beginPath();
    const angle = mouthOpen ? 0.2 : 0.01;
    ctx.arc(pacmanX, pacmanY, CELL_SIZE, angle + pacmanDirection, 
           (2 * Math.PI - angle) + pacmanDirection);
    ctx.lineTo(pacmanX, pacmanY);
    ctx.fillStyle = 'yellow';
    ctx.fill();
}

function drawGhost(ghost) {
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, CELL_SIZE, 0, Math.PI);
    ctx.rect(ghost.x - CELL_SIZE, ghost.y, CELL_SIZE * 2, CELL_SIZE);
    ctx.fillStyle = ghost.color;
    ctx.fill();
}

function drawMaze() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else if (maze[y][x] === 2) {
                ctx.beginPath();
                ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            }
        }
    }
}

function checkWallCollision(x, y) {
    const buffer = 2; // Collision buffer
    const gridX = Math.floor((x + CELL_SIZE/2) / CELL_SIZE);
    const gridY = Math.floor((y + CELL_SIZE/2) / CELL_SIZE);
    
    // Check if position is outside maze boundaries
    if (gridY < 0 || gridY >= maze.length || gridX < 0 || gridX >= maze[0].length) {
        return true;
    }
    
    return maze[gridY][gridX] === 1;
}

function updatePacmanPosition() {
    const directions = {
        ArrowRight: {dx: SPEED, dy: 0, dir: 0},
        ArrowLeft: {dx: -SPEED, dy: 0, dir: Math.PI},
        ArrowUp: {dx: 0, dy: -SPEED, dir: -Math.PI/2},
        ArrowDown: {dx: 0, dy: SPEED, dir: Math.PI/2}
    };

    if (currentKey && directions[currentKey]) {
        const dir = directions[currentKey];
        const newX = pacmanX + dir.dx;
        const newY = pacmanY + dir.dy;
        
        if (!checkWallCollision(newX, newY)) {
            pacmanX = newX;
            pacmanY = newY;
            pacmanDirection = dir.dir;
        }
    }
}

function checkDotCollection() {
    const gridX = Math.floor((pacmanX + CELL_SIZE/2) / CELL_SIZE);
    const gridY = Math.floor((pacmanY + CELL_SIZE/2) / CELL_SIZE);
    
    if (maze[gridY]?.[gridX] === 2) {
        maze[gridY][gridX] = 0;
        score += 10;
        scoreElement.textContent = `Score: ${score}`;
    }
}

function checkGhostCollision() {
    return ghosts.some(ghost => 
        Math.abs(ghost.x - pacmanX) < CELL_SIZE && 
        Math.abs(ghost.y - pacmanY) < CELL_SIZE
    );
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updatePacmanPosition();
    ghosts.forEach(ghost => ghost.move());
    drawMaze();
    drawPacman();
    ghosts.forEach(drawGhost);
    checkDotCollection();
    
    if (checkGhostCollision()) {
        gameOverElement.classList.remove('hidden');
        gameRunning = false;
        return;
    }
    
    mouthOpen = !mouthOpen;
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => {
    if (gameRunning) return;
    
    // Reset game state
    gameRunning = true;
    score = 0;
    pacmanX = 224;
    pacmanY = 360;
    currentKey = null;
    ghosts = [
        new Ghost('red', 224, 160),
        new Ghost('pink', 192, 160),
        new Ghost('cyan', 256, 160),
        new Ghost('orange', 224, 192)
    ];
    
    // Reset dots
    maze.forEach((row, y) => row.forEach((cell, x) => {
        if (cell === 0) maze[y][x] = 2;
    }));
    
    scoreElement.textContent = 'Score: 0';
    gameOverElement.classList.add('hidden');
    startBtn.blur();
    requestAnimationFrame(gameLoop);
});