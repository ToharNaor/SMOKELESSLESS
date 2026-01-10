/*
 * Pong Game Logic 🏓
 * The brain behind the paddle battles.
 * Handles physics, collisions, and state management.
 */

const { Server } = require("socket.io");

// Game Constants
const CANVAS_WIDTH = 800; // Virtual width
const CANVAS_HEIGHT = 600; // Virtual height
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const PADDLE_SPEED = 10; // Not used by server if client sends raw position, but good for reference
const TARGET_FPS = 60;

// Initial State Template
const TIMESTEP = 1000 / TARGET_FPS;

let gameState = {
  players: {
    player1: null, // Socket ID
    player2: null, // Socket ID
  },
  paddles: {
    player1: 250, // Y position (center is 300 - 50)
    player2: 250,
  },
  ball: {
    x: 400,
    y: 300,
    dx: 5, // Velocity X
    dy: 5, // Velocity Y
  },
  score: {
    player1: 0,
    player2: 0,
  },
};

let gameInterval = null;

function resetBall() {
  gameState.ball.x = CANVAS_WIDTH / 2;
  gameState.ball.y = CANVAS_HEIGHT / 2;
  // Randomize direction slightly
  gameState.ball.dx = Math.random() > 0.5 ? 5 : -5;
  gameState.ball.dy = Math.random() * 6 - 3; // Random Y between -3 and 3
}

function gameLoop(io) {
  if (!gameState.players.player1 || !gameState.players.player2) {
    // Pause if someone leaves
    return;
  }

  // --- Physics Step ---

  // Move Ball
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // 1. Wall Collisions (Top & Bottom)
  if (gameState.ball.y <= 0 || gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
    gameState.ball.dy *= -1; // Bounce straight back
  }

  // 2. Paddle Collisions
  // Player 1 (Left)
  if (
    gameState.ball.x <= PADDLE_WIDTH &&
    gameState.ball.y + BALL_SIZE >= gameState.paddles.player1 &&
    gameState.ball.y <= gameState.paddles.player1 + PADDLE_HEIGHT
  ) {
    gameState.ball.dx *= -1; // Bounce
    // Add some "english" based on where it hit the paddle
    let hitPoint =
      gameState.ball.y - (gameState.paddles.player1 + PADDLE_HEIGHT / 2);
    gameState.ball.dy = hitPoint * 0.1;
    // Speed up slightly for hype
    gameState.ball.dx *= 1.05;
  }

  // Player 2 (Right)
  if (
    gameState.ball.x + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH &&
    gameState.ball.y + BALL_SIZE >= gameState.paddles.player2 &&
    gameState.ball.y <= gameState.paddles.player2 + PADDLE_HEIGHT
  ) {
    gameState.ball.dx *= -1; // Bounce
    // Add "english"
    let hitPoint =
      gameState.ball.y - (gameState.paddles.player2 + PADDLE_HEIGHT / 2);
    gameState.ball.dy = hitPoint * 0.1;
    // Speed up slightly
    gameState.ball.dx *= 1.05;
  }

  // 3. Scoring (Left/Right Walls)
  if (gameState.ball.x < 0) {
    gameState.score.player2++;
    resetBall();
  } else if (gameState.ball.x > CANVAS_WIDTH) {
    gameState.score.player1++;
    resetBall();
  }

  // --- Emit Updates ---
  io.emit("gameState", gameState);
}

module.exports = (io) => {
  const pongNamespace = io.of("/pong");

  pongNamespace.on("connection", (socket) => {
    console.log(`User connected to Pong: ${socket.id}`);

    // Assign Roles
    let playerRole = "spectator";
    if (!gameState.players.player1) {
      gameState.players.player1 = socket.id;
      playerRole = "player1";
      console.log(`${socket.id} is Player 1`);
    } else if (!gameState.players.player2) {
      gameState.players.player2 = socket.id;
      playerRole = "player2";
      console.log(`${socket.id} is Player 2`);
    } else {
      console.log(`${socket.id} is Spectating`);
    }

    socket.emit("init", { role: playerRole });

    // Start Loop if 2 players are present and loop isn't running
    if (
      gameState.players.player1 &&
      gameState.players.player2 &&
      !gameInterval
    ) {
      console.log(">>> Game Starting! 🎮");
      resetBall();
      gameInterval = setInterval(() => gameLoop(pongNamespace), TIMESTEP);
    }

    // Handle Paddle Move
    socket.on("paddleMove", (yRatio) => {
      // yRatio is between 0 and 1 (from client mouse position)
      // Convert to actual Y coordinate
      // Clamp it so paddle stays on screen
      const actualY = yRatio * (CANVAS_HEIGHT - PADDLE_HEIGHT);

      if (playerRole === "player1") {
        gameState.paddles.player1 = actualY;
      } else if (playerRole === "player2") {
        gameState.paddles.player2 = actualY;
      }
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.id === gameState.players.player1) {
        gameState.players.player1 = null;
      } else if (socket.id === gameState.players.player2) {
        gameState.players.player2 = null;
      }

      // Stop loop if either player leaves (Game requires 2 to play)
      if (
        (!gameState.players.player1 || !gameState.players.player2) &&
        gameInterval
      ) {
        clearInterval(gameInterval);
        gameInterval = null;
        console.log(">>> Game Paused (Waiting for players) ⏸️");
      }
    });
  });
};
