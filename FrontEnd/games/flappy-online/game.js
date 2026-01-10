const socket = io("/flappy");
const canvas = document.getElementById("flappyCanvas");
const ctx = canvas.getContext("2d");
const statusDiv = document.getElementById("status");
const overlay = document.getElementById("game-overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayScore = document.getElementById("overlay-score");

// Game State Storage
let state = null;
let clientId = null;

// Images (Optional, using drawing for now to keep it neon)
// We will draw "Cyber Shapes"

socket.on("connect", () => {
  statusDiv.textContent = `Connected (ID: ${socket.id})`;
  clientId = socket.id;
});

socket.on("init", (data) => {
  // data.x (Bird X position)
});

socket.on("gameState", (gameState) => {
  state = gameState;
  overlay.classList.add("hidden"); // Hide overlay if playing
  render();
});

socket.on("gameOver", (data) => {
  overlayTitle.textContent = "GAME OVER";
  overlayTitle.style.color = "#ff0000"; // Red for death
  overlayScore.textContent = `Score: ${data.score}`;
  overlay.classList.remove("hidden");
  // Stop rendering? No, keeps last frame
});

// Input Handling
function jump() {
  socket.emit("jump");
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    jump();
  }
});

canvas.addEventListener("mousedown", () => {
  jump();
});

// Render Loop
function render() {
  if (!state) return;

  // Clear Screen
  ctx.fillStyle = "#0a0a10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Pipes
  ctx.fillStyle = "#00ff00"; // Matrix Green Pipes
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ff00";

  // Pipe Width = 60
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 150;

  state.pipes.forEach((pipe) => {
    // Top Pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

    // Bottom Pipe
    ctx.fillRect(
      pipe.x,
      pipe.topHeight + PIPE_GAP,
      PIPE_WIDTH,
      canvas.height - (pipe.topHeight + PIPE_GAP)
    );
  });

  // Draw Bird
  ctx.fillStyle = "#ffff00"; // Yellow Bird
  ctx.shadowColor = "#ffff00";

  // Bird is circle
  const BIRD_RADIUS = 15;
  const birdX = canvas.width / 3;

  ctx.beginPath();
  ctx.arc(birdX, state.bird.y, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Draw Ground Line
  ctx.fillStyle = "#00eaff";
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

  // Score (In-game)
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = '40px "Press Start 2P"';
  ctx.fillText(state.score, canvas.width / 2 - 15, 80);
}
