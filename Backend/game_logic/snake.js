/*
 * Snake Game Logic 🐍
 * Classic arcade action.
 * Server-side physics to prevent cheating (and for the challenge).
 * REFACTORED: Now supports infinite simultaneous instances! ♾️
 */

const { Server } = require("socket.io");

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20; // Size of one "block"
const TILE_COUNT_X = CANVAS_WIDTH / GRID_SIZE; // 40
const TILE_COUNT_Y = CANVAS_HEIGHT / GRID_SIZE; // 30
const TARGET_FPS = 15; // Snake is slower than Pong for control

// Initial State
const TIMESTEP = 1000 / TARGET_FPS;

// Store all active game sessions
// Key: Socket ID, Value: GameState Object
const sessions = new Map();

let gameLoopInterval = null;

// Factory function to create a pristine state
function createSession() {
  return {
    snake: [
      { x: 10, y: 10 }, // Head
      { x: 10, y: 11 }, // Body
      { x: 10, y: 12 }, // Tail
    ],
    velocity: { x: 0, y: -1 }, // Moving Up initially
    nextVelocity: { x: 0, y: -1 }, // Input Buffer
    food: spawnFood(null), // Will fix passing snake for collision check later if needed
    score: 0,
    gameOver: false,
  };
}

function spawnFood(snakeBody) {
  // Simple random spawn
  return {
    x: Math.floor(Math.random() * TILE_COUNT_X),
    y: Math.floor(Math.random() * TILE_COUNT_Y),
  };
}

function updateSession(socketId, session, ioNamespace) {
  if (session.gameOver) return;

  // Apply next velocity (input buffering)
  session.velocity = session.nextVelocity;

  // Calculate new head position
  const head = {
    x: session.snake[0].x + session.velocity.x,
    y: session.snake[0].y + session.velocity.y,
  };

  // 1. Check Wall Collisions
  if (
    head.x < 0 ||
    head.x >= TILE_COUNT_X ||
    head.y < 0 ||
    head.y >= TILE_COUNT_Y
  ) {
    session.gameOver = true;
    ioNamespace.to(socketId).emit("gameOver", { score: session.score });
    return;
  }

  // 2. Check Self Collision
  for (let segment of session.snake) {
    if (head.x === segment.x && head.y === segment.y) {
      session.gameOver = true;
      ioNamespace.to(socketId).emit("gameOver", { score: session.score });
      return;
    }
  }

  // Move Snake (Add new head)
  session.snake.unshift(head);

  // 3. Check Food Collision
  if (head.x === session.food.x && head.y === session.food.y) {
    session.score++;
    session.food = spawnFood(session.snake);
    // Don't pop the tail, so it grows
  } else {
    // Pop the tail to maintain size
    session.snake.pop();
  }

  // --- Emit Updates ---
  // Only emit to this specific socket!
  ioNamespace.to(socketId).emit("gameState", session);
}

function globalGameLoop(ioNamespace) {
  if (sessions.size === 0) {
    // Stop loop if empty
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    console.log(">>> Snake Loop Idle (0 Players) 💤");
    return;
  }

  // Iterate over every active session and update it
  sessions.forEach((session, socketId) => {
    updateSession(socketId, session, ioNamespace);
  });
}

module.exports = (io) => {
  const snakeNamespace = io.of("/snake");

  snakeNamespace.on("connection", (socket) => {
    console.log(`User connected to Snake: ${socket.id}`);

    // Create a new session for this user
    sessions.set(socket.id, createSession());

    // Tell client they are the player
    socket.emit("init", {
      role: "player1", // Everyone is Player 1 in their own universe
      gridSize: GRID_SIZE,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    // Ensure global loop is running
    if (!gameLoopInterval) {
      console.log(">>> Snake Loop Active 🐍");
      gameLoopInterval = setInterval(
        () => globalGameLoop(snakeNamespace),
        TIMESTEP
      );
    }

    // Handle Input
    socket.on("changeDirection", (direction) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      if (session.gameOver) {
        // Restart
        sessions.set(socket.id, createSession());
        return;
      }

      // Prevent 180 degree turns
      const current = session.velocity;
      if (
        (direction.x === 0 && current.x !== 0) ||
        (direction.y === 0 && current.y !== 0)
      ) {
        session.nextVelocity = direction;
      }
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      console.log(`Snake Player Left: ${socket.id}`);
      sessions.delete(socket.id);
      // Global loop will auto-stop on next tick if empty
    });
  });
};
