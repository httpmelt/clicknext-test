const pool = require('../config/db');

exports.getBoards = async (req, res) => {
    try {
        const boards = await pool.query(
            `SELECT b.board_id, b.name, b.owner_id, b.created_at 
             FROM boards b
             JOIN board_members bm ON b.board_id = bm.board_id
             WHERE bm.user_id = $1`,
            [req.user.user_id]
        );
        res.json(boards.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBoardMembers = async (req, res) => {
    const { id } = req.params;
    try {
        const members = await pool.query(
            `SELECT u.user_id, u.username, u.email, bm.role
             FROM users u
             JOIN board_members bm ON u.user_id = bm.user_id
             WHERE bm.board_id = $1`,
            [id]
        );
        res.json(members.rows);
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
            'INSERT INTO boards (name, owner_id) VALUES ($1, $2) RETURNING *',
            [name, req.user.user_id]
        );
        const board_id = newBoard.rows[0].board_id;
        
        // Add owner as a member
        await client.query(
            'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
            [board_id, req.user.user_id, 'owner']
        );

        // Default columns
        const defaultColumns = ['To Do', 'In Progress', 'Done'];
        for (let i = 0; i < defaultColumns.length; i++) {
            await client.query(
                'INSERT INTO columns (board_id, name, position) VALUES ($1, $2, $3)',
                [board_id, defaultColumns[i], i]
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
            'UPDATE boards SET name = $1 WHERE board_id = $2 AND owner_id = $3 RETURNING *',
            [name, id, req.user.user_id]
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
            'DELETE FROM boards WHERE board_id = $1 AND owner_id = $2 RETURNING *',
            [id, req.user.user_id]
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
        const user = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (user.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const invited_user_id = user.rows[0].user_id;

        // Check if already a member
        const memberCheck = await pool.query(
            'SELECT * FROM board_members WHERE board_id = $1 AND user_id = $2',
            [id, invited_user_id]
        );
        if (memberCheck.rowCount > 0) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        await pool.query(
            'INSERT INTO board_members (board_id, user_id) VALUES ($1, $2)',
            [id, invited_user_id]
        );

        // Notify user
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [invited_user_id, `You have been invited to board ${id}`]
        );

        res.json({ message: 'Member invited successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
