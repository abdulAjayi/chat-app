# Real-time chat monorepo

This repository contains a React/Vite frontend and an Express/Socket.io backend. Each app runs independently, so local development follows the same two-terminal workflow used for separate deployments.

## Run locally

1. Install dependencies: `npm install`
2. Update the existing `backend/.env` and `frontend/.env` files if the defaults do not suit your setup.
3. In one terminal, run `npm run backend`.
4. In a second terminal, run `npm run frontend`.

The frontend runs on `http://localhost:5173`; the backend runs on `http://localhost:3001` by default.

`VITE_SOCKET_URL` controls the browser's Socket.io target. `CLIENT_ORIGIN` controls which frontend origins the backend allows, and supports a comma-separated list for deployments.

## Intentional behavior and fixes

- Chat URLs use `?username=...&room=...`, so browser refreshes and a copied room URL retain the join details.
- Both `sendMessage` and `location` use `io.to(user.group).emit(...)`. This fixes the original global `io.emit(...)` leak between rooms.
- Server-side normalization trims and lowercases both username and room before validation, preventing whitespace-only names and preserving case-insensitive duplicate detection.
- Location permission, timeout, and position errors restore the location button and surface an in-app error.
- The message list only follows new content when the reader is within 56 pixels of the bottom.
