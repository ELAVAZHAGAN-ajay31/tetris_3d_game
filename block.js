import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

console.log('JavaScript loaded successfully');

// Grid dimensions
const GRID_WIDTH = 4;
const GRID_HEIGHT = 10;
const GRID_DEPTH = 5;

// 3D array: grid[x][y][z]
const grid = Array.from({ length: GRID_WIDTH }, () =>
  Array.from({ length: GRID_HEIGHT }, () =>
    Array(GRID_DEPTH).fill(null)
  )
);

// Check if position is valid
function isValidPosition(shape, pos) {
  for (let block of shape) {
    const x = block.x + pos.x;
    const y = block.y + pos.y;
    const z = block.z + pos.z;

    if (
      x < 0 || x >= GRID_WIDTH ||
      y < 0 || y >= GRID_HEIGHT ||
      z < 0 || z >= GRID_DEPTH
    ) return false;

    if (grid[x][y][z] !== null) return false;
  }
  return true;
}

const SHAPES = [
  // Cube
  [
    { x:0, y:0, z:0 },
    { x:1, y:0, z:0 },
    { x:0, y:1, z:0 },
    { x:1, y:1, z:0 }
  ],

  // Line (vertical)
  [
    { x:0, y:0, z:0 },
    { x:0, y:1, z:0 },
    { x:0, y:2, z:0 },
    { x:0, y:3, z:0 }
  ],

  // L shape
  [
    { x:0, y:0, z:0 },
    { x:0, y:1, z:0 },
    { x:0, y:2, z:0 },
    { x:1, y:0, z:0 }
  ],

  // T shape
  [
    { x:0, y:0, z:0 },
    { x:1, y:0, z:0 },
    { x:2, y:0, z:0 },
    { x:1, y:1, z:0 }
  ],

  // 3D corner (true 3D piece)
  [
    { x:0, y:0, z:0 },
    { x:1, y:0, z:0 },
    { x:0, y:1, z:0 },
    { x:0, y:0, z:1 }
  ]
];

const COLORS = [
  0xff4757, // red
  0x1e90ff, // blue
  0x2ed573, // green
  0xffa502, // orange
  0x3742fa  // indigo
];

function createBlockMesh(color) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.4
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Add edges for clarity
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );

  mesh.add(line);

  return mesh;
}

function createPiece(specificShape = null) {
  const shape = specificShape || SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const group = new THREE.Group();

  shape.forEach(block => {
    const cube = createBlockMesh(color);
    cube.position.set(block.x, block.y, block.z);
    group.add(cube);
  });

  return { group, shape };
}

function snapToGrid(obj) {
  obj.position.x = Math.round(obj.position.x);
  obj.position.y = Math.round(obj.position.y);
  obj.position.z = Math.round(obj.position.z);
}

function placePiece(piece, pos) {
  if (!isValidPosition(piece.shape, pos)) {
    console.log("Invalid position for piece placement");
    return false;
  }

  piece.group.position.copy(pos);
  snapToGrid(piece.group);

  // Add the piece to the grid
  piece.shape.forEach(block => {
    const x = block.x + pos.x;
    const y = block.y + pos.y;
    const z = block.z + pos.z;
    grid[x][y][z] = piece.group;
  });

  return true;
}

function clearFullLayers() {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    let isFullLayer = true;
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let z = 0; z < GRID_DEPTH; z++) {
            if (grid[x][y][z] === null) {
                isFullLayer = false;
                break;
            }
        }
        if (!isFullLayer) break;
    }
    if (isFullLayer) {
      // Clear the layer
      for (let x = 0; x < GRID_WIDTH; x++) {
        for (let z = 0; z < GRID_DEPTH; z++) {
          grid[x][y][z] = null;
        }
      }
    }
  }
}

const ambient = new THREE.AmbientLight(0xffffff, 1.2); // Increased brightness
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 20, 10);
console.log('Lights created - Ambient brightness: 1.2, Directional brightness: 1.5');

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Dark gray background
scene.add(ambient);
scene.add(dirLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer;
try {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  console.log('WebGL renderer created successfully');
} catch (error) {
  console.error('Failed to create WebGL renderer:', error);
  // Fallback: show error message
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '20px';
  errorDiv.innerHTML = 'Error: WebGL not supported or failed to initialize.<br>Please make sure your browser supports WebGL.';
  document.body.appendChild(errorDiv);
  throw error;
}

// Camera position
camera.position.set(8, 10, 8);
camera.lookAt(GRID_WIDTH/2, GRID_HEIGHT/2, GRID_DEPTH/2);
console.log('Camera positioned to view game area');

// Scene is ready for game pieces
console.log('Game scene initialized, ready for gameplay');

// Create grid boundaries
function createBoundaries() {
  const boundaryMaterial = new THREE.MeshBasicMaterial({
    color: 0x666666,
    wireframe: false,
    transparent: true,
    opacity: 0.2
  });

  // Create boundary walls
  const wallGeometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_HEIGHT);

  // Back wall (z = 0)
  const backWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  backWall.position.set(GRID_WIDTH/2, GRID_HEIGHT/2, 0);
  scene.add(backWall);

  // Front wall (z = GRID_DEPTH)
  const frontWall = new THREE.Mesh(wallGeometry, boundaryMaterial);
  frontWall.position.set(GRID_WIDTH/2, GRID_HEIGHT/2, GRID_DEPTH);
  scene.add(frontWall);

  // Left wall (x = 0)
  const leftWallGeometry = new THREE.PlaneGeometry(GRID_DEPTH, GRID_HEIGHT);
  const leftWall = new THREE.Mesh(leftWallGeometry, boundaryMaterial);
  leftWall.position.set(0, GRID_HEIGHT/2, GRID_DEPTH/2);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  // Right wall (x = GRID_WIDTH)
  const rightWall = new THREE.Mesh(leftWallGeometry, boundaryMaterial);
  rightWall.position.set(GRID_WIDTH, GRID_HEIGHT/2, GRID_DEPTH/2);
  rightWall.rotation.y = Math.PI / 2;
  scene.add(rightWall);

  // Bottom (y = 0)
  const bottomGeometry = new THREE.PlaneGeometry(GRID_WIDTH, GRID_DEPTH);
  const bottom = new THREE.Mesh(bottomGeometry, boundaryMaterial);
  bottom.position.set(GRID_WIDTH/2, 0, GRID_DEPTH/2);
  bottom.rotation.x = -Math.PI / 2;
  scene.add(bottom);

  // Top (y = GRID_HEIGHT) - spawn area
  const top = new THREE.Mesh(bottomGeometry, boundaryMaterial);
  top.position.set(GRID_WIDTH/2, GRID_HEIGHT, GRID_DEPTH/2);
  top.rotation.x = -Math.PI / 2;
  scene.add(top);
}

// Game state
let currentPiece = null;
let currentPosition = new THREE.Vector3(GRID_WIDTH/2 - 1, GRID_HEIGHT - 1, GRID_DEPTH/2 - 1);
let gameRunning = true;
const AUTO_DROP_CHANCE = 0.015; // Faster auto-drop than before (was 0.005)

function hardDrop() {
  if (!currentPiece || !gameRunning) return;

  while (isValidPosition(currentPiece.shape, currentPosition)) {
    currentPosition.y -= 1;
  }

  currentPosition.y += 1;
  placePiece(currentPiece, currentPosition);
  spawnPiece();
}

// Create initial piece
function spawnPiece() {
  // Spawn at top center, slightly back from the front
  const testPos = new THREE.Vector3(2, GRID_HEIGHT - 2, 2);
  
  console.log('Attempting to spawn piece at:', testPos);
  
  // Check if ANY shape can fit at spawn position
  let canSpawn = false;
  for (let shape of SHAPES) {
    if (isValidPosition(shape, testPos)) {
      canSpawn = true;
      break;
    }
  }
  
  if (canSpawn) {
    // Spawn a random piece (not necessarily the first valid one)
    currentPiece = createPiece(); // Let it choose random shape
    currentPosition.copy(testPos);
    scene.add(currentPiece.group);
    currentPiece.group.position.copy(currentPosition);
    console.log('✓ Piece spawned successfully - Shape:', currentPiece.shape.length, 'blocks');
    return;
  }
  
  // If spawn fails, try lower position
  const fallbackPos = new THREE.Vector3(2, GRID_HEIGHT - 5, 2);
  console.log('Initial spawn failed, trying fallback position:', fallbackPos);
  
  canSpawn = false;
  for (let shape of SHAPES) {
    if (isValidPosition(shape, fallbackPos)) {
      canSpawn = true;
      break;
    }
  }
  
  if (canSpawn) {
    currentPiece = createPiece(); // Random shape
    currentPosition.copy(fallbackPos);
    scene.add(currentPiece.group);
    currentPiece.group.position.copy(currentPosition);
    console.log('✓ Piece spawned at fallback position');
    return;
  }
  
  console.log('✗ Cannot spawn piece at any position');
  gameRunning = false;
}

// Input handling
const keys = {};
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !keys['Space']) {
    hardDrop();
  }
  keys[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

// Game loop - ALWAYS render, even if game over
let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);

  frameCount++;
  if (frameCount === 1) {
    console.log('Animation loop started, rendering scene with', scene.children.length, 'objects');
  }

  // ALWAYS render the scene
  renderer.render(scene, camera);

  if (!gameRunning) return;

  // Handle input
  if (keys['ArrowLeft']) {
    currentPosition.x -= 1;
    if (!isValidPosition(currentPiece.shape, currentPosition)) {
      currentPosition.x += 1;
    }
  }
  if (keys['ArrowRight']) {
    currentPosition.x += 1;
    if (!isValidPosition(currentPiece.shape, currentPosition)) {
      currentPosition.x -= 1;
    }
  }
  if (keys['ArrowUp']) {
    currentPosition.z -= 1;
    if (!isValidPosition(currentPiece.shape, currentPosition)) {
      currentPosition.z += 1;
    }
  }
  if (keys['ArrowDown']) {
    currentPosition.z += 1;
    if (!isValidPosition(currentPiece.shape, currentPosition)) {
      currentPosition.z -= 1;
    }
  }
  // Auto drop (faster tuned value)
  if (Math.random() < AUTO_DROP_CHANCE) {
    currentPosition.y -= 1;
    if (!isValidPosition(currentPiece.shape, currentPosition)) {
      currentPosition.y += 1;
      placePiece(currentPiece, currentPosition);
      spawnPiece();
    }
  }
 

  // Update piece position
  if (currentPiece) {
    currentPiece.group.position.copy(currentPosition);
  }
}

// Start game
createBoundaries();
spawnPiece();
animate();