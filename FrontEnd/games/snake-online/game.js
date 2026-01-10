const canvas = document.getElementById("snakeCanvas");
const ctx = canvas.getContext("2d");
const statusDiv = document.getElementById("status");
const overlay = document.getElementById("game-overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayScore = document.getElementById("overlay-score");

// Connect to Snake Namespace
const socket = io("http://localhost:3001/snake");

let role = "spectator";
let gridSize = 20; // Default, will update from server init

// --- Socket Events ---

socket.on("connect", () => {
  statusDiv.textContent = "Connecting to Mainframe...";
  console.log("Connected ID:", socket.id);
});

socket.on("init", (data) => {
  role = data.role;
  gridSize = data.gridSize;

  // Update Canvas size just in case
  canvas.width = data.width;
  canvas.height = data.height;

  let roleText =
    role === "player1" ? "PLAYER 1 (CONTROLLER)" : "SPECTATOR MODE";
  statusDiv.textContent = `SYSTEM STATUS: ${roleText}`;

  // Hide overlay on new init if needed
  overlay.classList.add("hidden");
});

socket.on("gameState", (state) => {
  render(state);
  // Ensure overlay is hidden if game is running and not game over
  if (!state.gameOver) {
    overlay.classList.add("hidden");
  }
});

socket.on("gameOver", (data) => {
  overlayTitle.textContent = "CRITICAL FAILURE"; // Game Over
  overlayScore.textContent = `FINAL SCORE: ${data.score}`;
  overlay.classList.remove("hidden");
});

socket.on("disconnect", () => {
  statusDiv.textContent = "SIGNAL LOST 🔌";
});

// --- Input Handling ---

document.addEventListener("keydown", (e) => {
  if (role !== "player1") return;

  // Send restart signal if game over is visible
  if (!overlay.classList.contains("hidden")) {
    // Any key to restart logic handled by server receiving input on gameover state
    // For now, simple direction change triggers restart
  }

  let direction = null;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
    case "S":
      direction = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      direction = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
    case "D":
      direction = { x: 1, y: 0 };
      break;
  }

  if (direction) {
    socket.emit("changeDirection", direction);
  }
});

// --- Rendering ---

function render(state) {
  // 1. Clear Screen
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw Food (Pulse effect?)
  ctx.fillStyle = "#ff3333"; // Red Apple
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ff3333";
  ctx.fillRect(
    state.food.x * gridSize,
    state.food.y * gridSize,
    gridSize - 2,
    gridSize - 2
  );
  ctx.shadowBlur = 0;

  // 3. Draw Snake
  ctx.fillStyle = "#33ff00"; // Matrix Green
  state.snake.forEach((segment, index) => {
    // Head is slightly brighter
    if (index === 0) {
      ctx.fillStyle = "#ccffcc";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#33ff00";
    } else {
      ctx.fillStyle = "#33ff00";
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 2,
      gridSize - 2
    );
  });

  // 4. Draw Score (HUD)
  ctx.fillStyle = "rgba(51, 255, 0, 0.3)";
  ctx.font = "40px VT323";
  ctx.textAlign = "right";
  ctx.fillText(`SCORE: ${state.score}`, canvas.width - 20, 40);
}
