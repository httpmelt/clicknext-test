# Kanban Board System

A simple and powerful Kanban Board system built with React (Next.js), Node.js (Express), and PostgreSQL.

## Features
- User Authentication (Register/Login)
- Board Management (Create, Delete, Rename)
- Column Management (Create, Delete)
- Task Management (Create, Delete, Drag-and-drop)
- Board Invitations
- Task Assignments & Notifications

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, @hello-pangea/dnd, Axios, Lucide React
- **Backend:** Node.js, Express, PostgreSQL (pg), JWT, BcryptJS
- **Database:** PostgreSQL

## Setup Instructions

### Backend Setup
1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your database in `.env`:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=kanban_db
   JWT_SECRET=your_jwt_secret_key
   ```
4. Initialize the database:
   ```bash
   npm run db:setup
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:3000`

## Project Structure
- `backend/`: Express server, controllers, routes, and DB setup.
- `frontend/`: Next.js application, components, and API integration.
