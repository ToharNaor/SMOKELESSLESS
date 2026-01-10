# Frontend Mechanics Documentation 🎨

This document explains how the client-side JavaScript (`game.js`) works across all three games (Pong, Snake, Flappy Bird). They share a common architecture based on **Socket.io** and **HTML5 Canvas**.

## Core Architecture pattern

### 1. Connection & Initialization

All games start by connecting to their specific namespace:

```javascript
const socket = io("/pong"); // or /snake, /flappy
```

This is essential for routing traffic correctly on the backend.

### 2. The Render Loop (View Layer)

Unlike the backend which runs the _Physics Loop_, the frontend runs a _Render Loop_.

- **Passive Rendering**: The frontend does _not_ calculate game logic (e.g., ball position). It assumes the server is correct.
- **State Sync**: The socket receives `gameState` events 15-60 times a second. It saves this object to a global `let state`.
- **Drawing**: The `render()` function clears the Canvas and repaints the entire screen based on the latest `state`.

### 3. Input Handling (Controller Layer)

Inputs are captured locally and sent to the server immediately. We do **not** move the character locally (Client-Side Prediction is currently disabled for simplicity and anti-cheating).

**Input Mapping:**

- **Pong**: `mousemove` -> Calculates Y ratio (0.0 to 1.0) -> Emits `paddleMove`.
- **Snake**: `keydown` (Arrow Keys) -> Emits `changeDirection`.
- **Flappy**: `keydown` (Space) or `mousedown` -> Emits `jump`.

## Game Specifics

### Pong Frontend (`pong-online/game.js`)

- **Interpolation**: None (Raw state rendering).
- **Visuals**: Draws simple rectangles. Uses `ctx.setLineDash` for the center net.
- **Roles**: Checks `socket.id` against `state.players` to display "Player 1", "Player 2", or "Spectator".

### Snake Frontend (`snake-online/game.js`)

- **Grid Rendering**: Loops through the `state.snake` array.
- **Head vs Body**: Draws the head slightly differently (or same color).
- **Food**: Draws a red square at `state.food`.
- **Overlay**: The Game Over screen is a DOM element (`div`) toggled via CSS classes (`hidden`), triggered by the `gameOver` socket event.

### Flappy Frontend (`flappy-online/game.js`)

- **Assets**: Currently uses geometric shapes (Circles/Rectangles) drawn via Canvas API to maintain the "Neon" aesthetic without loading image files.
- **Parallax**: Not currently implemented (Background is static color), but pipes move based on server state.
