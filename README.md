# Complaint Management App

Desktop-first complaint tracking system built with Electron, React, Express, and MongoDB.

The app packages a React frontend together with a Node/Express backend, so the Windows installer can run the UI and API as a single desktop application.

## Overview

This repository contains:

- `frontend/`: Electron + Vite + React desktop application
- `backend/`: Express API with MongoDB persistence

Core capabilities:

- User registration and login with JWT authentication
- Role-based access for `ENGINEER` and `ADMIN`
- Complaint creation, viewing, editing, and status updates
- Engineer-scoped complaint access with admin-wide visibility
- Windows `.exe` packaging with Electron Builder
- GitHub release publishing with `electron-updater`

## Tech Stack

- Electron
- React
- Vite
- Express
- MongoDB with Mongoose
- JWT authentication
- Electron Builder
- Vitest + Testing Library

## Repository Structure

```text
complaint-system/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    server.js
  frontend/
    electron/
    public/
    src/
    package.json
```

## How It Works

The desktop app starts Electron and then launches the backend server as a child process.

- In development, the backend runs separately with Node
- In packaged builds, Electron starts the bundled backend from `resources/backend`
- The React app talks to the backend over HTTP
- Authentication is handled with JWT tokens stored in local storage

## Features

### Authentication

- Register a new engineer account
- Log in with email and password
- Session expiration handling for expired JWTs

### Complaint Management

- Create complaints with customer, system, item, spare, and charge details
- View personal complaints as an engineer
- View all complaints as an admin
- Update complaint details and status
- Delete complaints as an admin
- Search, filter, sort, and paginate complaint lists

### Roles

- `ENGINEER`
: Can create complaints, view personal complaints, and update only owned complaints
- `ADMIN`
: Can view all complaints, update complaints, and delete complaints

## Environment Variables

The backend expects these variables.

Create `backend/.env` using `backend/.env.example` as a starting point:

```env
MONGO_URI=mongodb://127.0.0.1:27017/complaint-system
JWT_SECRET=change_this_to_a_strong_secret
PORT=5000
```

Optional frontend variable:

```env
VITE_API_URL=http://localhost:5000/api/auth
```

If `VITE_API_URL` is not set, the frontend defaults to `http://localhost:5000/api/auth`.

## Installation

Install dependencies in both projects.

### Backend

```powershell
cd backend
npm install
```

### Frontend

```powershell
cd frontend
npm install
```

## Running in Development

Run the backend and frontend in separate terminals.

### Start the backend

```powershell
cd backend
npm run dev
```

### Start the frontend

```powershell
cd frontend
npm run dev
```

The Vite app will be available in the browser during development. The packaged Electron preview build can be launched separately if needed.

## Available Scripts

### Backend scripts

- `npm run dev`: start the backend with nodemon
- `npm start`: start the backend with Node

### Frontend scripts

- `npm run dev`: start the Vite frontend
- `npm run build`: build the frontend
- `npm run test`: run tests once
- `npm run test:watch`: run tests in watch mode
- `npm run lint`: run ESLint
- `npm run electron:preview`: build and open the Electron app locally
- `npm run electron:build`: create installable desktop builds
- `npm run electron:publish`: build and publish a release to GitHub

## API Summary

### Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`

### Complaint routes

- `POST /api/complaints`: create complaint
- `GET /api/complaints`: admin-only list of all complaints
- `GET /api/complaints/my`: current user's complaints
- `GET /api/complaints/:id`: complaint detail with access checks
- `PUT /api/complaints/:id`: update complaint
- `DELETE /api/complaints/:id`: admin-only delete

All complaint routes require a Bearer token.

## Building the Windows Installer

From the `frontend/` directory:

```powershell
cd frontend
npm run electron:build
```

Build output is generated in:

- `frontend/release/`

Typical release artifacts include:

- Windows installer `.exe`
- `latest.yml`
- blockmap files used by auto-update

## Publishing App Updates

This project is already configured to publish releases to GitHub using Electron Builder and `electron-updater`.

### Release flow

1. Update the version in `frontend/package.json`
2. Commit and push your source changes
3. Set a GitHub token in PowerShell
4. Publish the Electron release

```powershell
$env:GH_TOKEN="your_github_personal_access_token"
cd frontend
npm run electron:publish
```

This command:

- Builds the frontend
- Packages the Electron app
- Uploads release assets to the GitHub repository
- Uploads update metadata for auto-update

## Testing

Frontend tests use Vitest and Testing Library.

```powershell
cd frontend
npm run test
```

## Notes

- The frontend uses `HashRouter`, which works well for packaged desktop apps
- Generated build output such as `dist`, `dist-electron`, and `release` is ignored by Git
- The backend retries MongoDB connection attempts on startup and can continue running even if the database is temporarily unavailable

## Future Improvements

- Add a combined root-level start script for backend and frontend development
- Add seeded admin account setup for first-time installs
- Add CI for tests and packaged desktop builds
- Add screenshots and release notes to this README