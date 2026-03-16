const pool = require('../config/db');

exports.getBoards = async (req, res) => {
    try {
        const boards = await pool.query(
            `SELECT b."boardId", b.name, b."ownerId", b."createdAt" 
             FROM "Boards" b
             JOIN "BoardMembers" bm ON b."boardId" = bm."boardId"
             WHERE bm."userId" = $1`,
            [req.user.userId]
        );
        res.json(boards.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createBoard = async (req, res) => {
    const { name } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const newBoard = await client.query(
            'INSERT INTO "Boards" (name, "ownerId") VALUES ($1, $2) RETURNING *',
            [name, req.user.userId]
        );
        const boardId = newBoard.rows[0].boardId;
        
        // Add owner as a member
        await client.query(
            'INSERT INTO "BoardMembers" ("boardId", "userId", role) VALUES ($1, $2, $3)',
            [boardId, req.user.userId, 'owner']
        );

        // Default columns
        const defaultColumns = ['To Do', 'In Progress', 'Done'];
        for (let i = 0; i < defaultColumns.length; i++) {
            await client.query(
                'INSERT INTO "Columns" ("boardId", name, position) VALUES ($1, $2, $3)',
                [boardId, defaultColumns[i], i]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(newBoard.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

exports.updateBoard = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const updatedBoard = await pool.query(
            'UPDATE "Boards" SET name = $1 WHERE "boardId" = $2 AND "ownerId" = $3 RETURNING *',
            [name, id, req.user.userId]
        );
        if (updatedBoard.rowCount === 0) {
            return res.status(403).json({ message: 'Not authorized or board not found' });
        }
        res.json(updatedBoard.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteBoard = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBoard = await pool.query(
            'DELETE FROM "Boards" WHERE "boardId" = $1 AND "ownerId" = $2 RETURNING *',
            [id, req.user.userId]
        );
        if (deletedBoard.rowCount === 0) {
            return res.status(403).json({ message: 'Not authorized or board not found' });
        }
        res.json({ message: 'Board deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.inviteMember = async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    try {
        // Check if user exists
        const user = await pool.query('SELECT "userId" FROM "Users" WHERE username = $1', [username]);
        if (user.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const invitedUserId = user.rows[0].userId;

        // Check if already a member
        const memberCheck = await pool.query(
            'SELECT * FROM "BoardMembers" WHERE "boardId" = $1 AND "userId" = $2',
            [id, invitedUserId]
        );
        if (memberCheck.rowCount > 0) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        await pool.query(
            'INSERT INTO "BoardMembers" ("boardId", "userId") VALUES ($1, $2)',
            [id, invitedUserId]
        );

        // Notify user
        await pool.query(
            'INSERT INTO "Notifications" ("userId", message) VALUES ($1, $2)',
            [invitedUserId, `You have been invited to board ${id}`]
        );

        res.json({ message: 'Member invited successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
