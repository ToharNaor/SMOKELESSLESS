const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const statusDiv = document.getElementById("status");

// Connect to the specific namespace
// Assumes server is running on localhost:3001 (based on our setup)
const socket = io("http://localhost:3001/pong");

// Game Constants (Must match server)
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;

let role = "spectator";

// --- Socket Events ---

socket.on("connect", () => {
  statusDiv.textContent = "Connected! Waiting for assignment...";
  console.log("Connected with ID:", socket.id);
});

socket.on("init", (data) => {
  role = data.role;
  let roleText =
    role === "spectator"
      ? "Spectating"
      : role === "player1"
      ? "Player 1 (Left)"
      : "Player 2 (Right)";
  statusDiv.textContent = `Role: ${roleText}`;
});

socket.on("gameState", (gameState) => {
  render(gameState);
});

socket.on("disconnect", () => {
  statusDiv.textContent = "Disconnected from server 🔌";
});

// --- Input Handling ---

// Track mouse movement
canvas.addEventListener("mousemove", (e) => {
  if (role === "spectator") return;

  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;

  // Normalize Y to 0-1 ratio to send to server
  // Center the paddle on the mouse
  let yRatio = (mouseY - PADDLE_HEIGHT / 2) / (canvas.height - PADDLE_HEIGHT);

  // Clamp between 0 and 1
  yRatio = Math.max(0, Math.min(1, yRatio));

  socket.emit("paddleMove", yRatio);
});

// --- Rendering ---

function render(state) {
  // Clear screen
  ctx.fillStyle = "#1a1a20";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Net
  ctx.strokeStyle = "#333";
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Paddles
  // Player 1 (Cyan)
  ctx.fillStyle = "#00f3ff";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00f3ff";
  ctx.fillRect(0, state.paddles.player1, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Player 2 (Magenta)
  ctx.fillStyle = "#ff00ff";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff00ff";
  ctx.fillRect(
    canvas.width - PADDLE_WIDTH,
    state.paddles.player2,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  // Draw Ball (White/Yellow glow)
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ffffff";
  ctx.beginPath();
  ctx.arc(
    state.ball.x + BALL_SIZE / 2,
    state.ball.y + BALL_SIZE / 2,
    BALL_SIZE / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Reset Shadows
  ctx.shadowBlur = 0;

  // Draw Score
  ctx.font = "80px Orbitron";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.textAlign = "center";
  ctx.fillText(state.score.player1, canvas.width / 4, 100);
  ctx.fillText(state.score.player2, (canvas.width / 4) * 3, 100);
}
