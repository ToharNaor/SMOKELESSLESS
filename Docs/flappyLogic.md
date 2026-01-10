# Flappy Bird Logic Documentation 🐦

## Overview

The `flappy.js` module handles the server-side physics and state for the Flappy Bird game.
It utilizes the **Multi-Instance Architecture** (similar to Snake), meaning each connected player gets their own isolated game session.

## Architecture

- **Namespace**: `/flappy`
- **Session Storage**: `Map<SocketID, SessionObject>`
- **Update Loop**: One global server loop running at **30 FPS**.

## Game Mechanics

### 1. The Bird

- **Vertical Movement**: Controlled by `velocity` and `gravity`.
  - Gravity (0.6) is added to velocity every frame.
  - Velocity is added to Y position.
- **Jumping**: When the client emits `jump`, velocity is set instantly to `-10` (upward impulse).
- **X Position**: The bird does _not_ move horizontally. Instead, the pipes move left to create the illusion of forward flight. The bird's X is fixed at `CANVAS_WIDTH / 3`.

### 2. Pipe System

- **Spawning**: Pipes are generated at `x = CANVAS_WIDTH`.
- **Gap**: A simplified math randomizer picks the `topHeight`. The bottom pipe is automatically placed at `topHeight + PIPE_GAP` (150px).
- **Recycling**: Pipes that move off-screen (`x < -width`) are removed from the array to save memory.
- **Scoring**: When a pipe passes the bird's X coordinate, the score increments.

### 3. Collision Detection (AABB)

The server performs authoritative collision checks:

1.  **Ground/Ceiling**: If `bird.y` exceeds canvas bounds -> Game Over.
2.  **Pipes**:
    - First, check if Bird is within the horizontal range of a pipe.
    - If yes, check if Bird Y is _above_ the gap start or _below_ the gap end.
    - If either is true -> Game Over.

## Socket Events

- `jump`: Triggers a flap. If Game Over, it resets the session.
- `gameState`: Server emits the bird position, pipe array, and score.
- `gameOver`: Emitted on death.
