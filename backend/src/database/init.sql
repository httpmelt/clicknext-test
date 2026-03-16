-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "userId" SERIAL PRIMARY KEY,
    "username" VARCHAR(50) UNIQUE NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards Table
CREATE TABLE IF NOT EXISTS "Boards" (
    "boardId" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "ownerId" INTEGER REFERENCES "Users"("userId") ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Board Members Table
CREATE TABLE IF NOT EXISTS "BoardMembers" (
    "boardId" INTEGER REFERENCES "Boards"("boardId") ON DELETE CASCADE,
    "userId" INTEGER REFERENCES "Users"("userId") ON DELETE CASCADE,
    "role" VARCHAR(20) DEFAULT 'member',
    PRIMARY KEY ("boardId", "userId")
);

-- Columns Table
CREATE TABLE IF NOT EXISTS "Columns" (
    "columnId" SERIAL PRIMARY KEY,
    "boardId" INTEGER REFERENCES "Boards"("boardId") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS "Tasks" (
    "taskId" SERIAL PRIMARY KEY,
    "columnId" INTEGER REFERENCES "Columns"("columnId") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Assignments Table
CREATE TABLE IF NOT EXISTS "TaskAssignments" (
    "taskId" INTEGER REFERENCES "Tasks"("taskId") ON DELETE CASCADE,
    "userId" INTEGER REFERENCES "Users"("userId") ON DELETE CASCADE,
    PRIMARY KEY ("taskId", "userId")
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS "Notifications" (
    "notificationId" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "Users"("userId") ON DELETE CASCADE,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
