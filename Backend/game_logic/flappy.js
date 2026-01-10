/*
 * Flappy Bird Logic 🐦
 * Gravity, Pipes, and Pain.
 * Multi-Instance: Everyone gets their own bird.
 */

const { Server } = require("socket.io");

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TARGET_FPS = 30; // Smooth enough for flappy
const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const SPEED = 5; // Horizontal scrolling speed
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPACING = 300; // Distance between pipes
const BIRD_RADIUS = 15;

const TIMESTEP = 1000 / TARGET_FPS;

// Sessions Map: <SocketID, GameState>
const sessions = new Map();

let gameLoopInterval = null;

function createSession() {
  return {
    bird: {
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      radius: BIRD_RADIUS,
    },
    pipes: [], // Array of { x, topHeight, passed }
    score: 0,
    gameOver: false,
    started: false, // Wait for first jump to start
  };
}

function spawnPipe() {
  // Random height for the top pipe
  // Min height 50, Max height CANVAS - GAP - 50
  const minPipe = 50;
  const maxPipe = CANVAS_HEIGHT - PIPE_GAP - 50;
  const topHeight =
    Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;

  return {
    x: CANVAS_WIDTH,
    topHeight: topHeight,
    passed: false,
  };
}

function updateSession(socketId, session, ioNamespace) {
  if (session.gameOver || !session.started) return;

  // 1. Physics (Gravity)
  session.bird.velocity += GRAVITY;
  session.bird.y += session.bird.velocity;

  // 2. Pipe Management
  // Add new pipe if needed
  if (
    session.pipes.length === 0 ||
    CANVAS_WIDTH - session.pipes[session.pipes.length - 1].x >= PIPE_SPACING
  ) {
    session.pipes.push(spawnPipe());
  }

  // Move pipes
  for (let i = session.pipes.length - 1; i >= 0; i--) {
    let pipe = session.pipes[i];
    pipe.x -= SPEED;

    // Remove off-screen pipes
    if (pipe.x + PIPE_WIDTH < 0) {
      session.pipes.splice(i, 1);
      continue;
    }

    // Checking for Score (passing the pipe)
    if (!pipe.passed && pipe.x + PIPE_WIDTH < CANVAS_WIDTH / 2 - BIRD_RADIUS) {
      pipe.passed = true;
      session.score++;
    }

    // 3. Collision Detection
    // Bird X is fixed at center (CANVAS_WIDTH / 2) ???
    // Usually bird stays at roughly 1/3 of screen or center. Let's fix bird X.
    const birdX = CANVAS_WIDTH / 3;

    // AABB Collision with Pipe
    // Pipe X range: [pipe.x, pipe.x + PIPE_WIDTH]
    if (
      birdX + BIRD_RADIUS > pipe.x &&
      birdX - BIRD_RADIUS < pipe.x + PIPE_WIDTH
    ) {
      // Within horizontal pipe area
      // Check Vertical: Hit Top Pipe OR Hit Bottom Pipe
      if (
        session.bird.y - BIRD_RADIUS < pipe.topHeight ||
        session.bird.y + BIRD_RADIUS > pipe.topHeight + PIPE_GAP
      ) {
        session.gameOver = true;
      }
    }
  }

  // 4. Ground/Ceiling Collision
  if (
    session.bird.y + BIRD_RADIUS >= CANVAS_HEIGHT ||
    session.bird.y - BIRD_RADIUS <= 0
  ) {
    session.gameOver = true;
  }

  // Emit Updates
  if (session.gameOver) {
    ioNamespace.to(socketId).emit("gameOver", { score: session.score });
  } else {
    ioNamespace.to(socketId).emit("gameState", {
      bird: session.bird,
      pipes: session.pipes,
      score: session.score,
    });
  }
}

function globalGameLoop(ioNamespace) {
  if (sessions.size === 0) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    console.log(">>> Flappy Loop Idle 💤");
    return;
  }

  sessions.forEach((session, socketId) => {
    updateSession(socketId, session, ioNamespace);
  });
}

module.exports = (io) => {
  const flappyNamespace = io.of("/flappy");

  flappyNamespace.on("connection", (socket) => {
    console.log(`Flappy Bird Joined: ${socket.id}`);
    sessions.set(socket.id, createSession());

    // Send Init Data (fixed bird X position)
    socket.emit("init", { x: CANVAS_WIDTH / 3 });

    // Ensure loop is running
    if (!gameLoopInterval) {
      console.log(">>> Flappy Loop Active 🦅");
      gameLoopInterval = setInterval(
        () => globalGameLoop(flappyNamespace),
        TIMESTEP
      );
    }

    // Input: Jump
    socket.on("jump", () => {
      const session = sessions.get(socket.id);
      if (!session) return;

      if (session.gameOver) {
        // Restart
        sessions.set(socket.id, createSession());
        // Need to re-trigger started if we want instant start, or wait for next jump
        // key "jump" usually restarts AND jumps or just restarts.
        // Let's make it restart to waiting state.
        const newSession = sessions.get(socket.id);
        newSession.started = true;
        newSession.bird.velocity = JUMP_STRENGTH;
        return;
      }

      if (!session.started) {
        session.started = true;
      }

      session.bird.velocity = JUMP_STRENGTH;
    });

    socket.on("disconnect", () => {
      sessions.delete(socket.id);
    });
  });
};
