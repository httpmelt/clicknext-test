const pool = require('../config/db');

exports.getTasks = async (req, res) => {
    const { columnId } = req.params;
    try {
        const tasks = await pool.query(
            `SELECT t.*, 
             COALESCE(
                 (SELECT JSON_AGG(u.*) 
                  FROM users u 
                  JOIN task_assignments ta ON u.user_id = ta.user_id 
                  WHERE ta.task_id = t.task_id), 
                 '[]'
             ) AS assigned_users
             FROM tasks t 
             WHERE t.column_id = $1 
             ORDER BY t.position ASC`,
            [columnId]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createTask = async (req, res) => {
    const { columnId } = req.params;
    const { title, description, position, tags } = req.body;
    try {
        const newTask = await pool.query(
            'INSERT INTO tasks (column_id, title, description, position, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [columnId, title, description, position, tags]
        );
        res.status(201).json({ ...newTask.rows[0], assigned_users: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, position, column_id, tags } = req.body;
    try {
        const updatedTask = await pool.query(
            `UPDATE tasks SET 
                title = COALESCE($1, title), 
                description = COALESCE($2, description), 
                position = COALESCE($3, position), 
                column_id = COALESCE($4, column_id),
                tags = COALESCE($5, tags)
             WHERE task_id = $6 RETURNING *`,
            [title, description, position, column_id, tags, id]
        );
        
        const taskWithUsers = await pool.query(
            `SELECT t.*, 
             COALESCE(
                 (SELECT JSON_AGG(u.*) 
                  FROM users u 
                  JOIN task_assignments ta ON u.user_id = ta.user_id 
                  WHERE ta.task_id = t.task_id), 
                 '[]'
             ) AS assigned_users
             FROM tasks t 
             WHERE t.task_id = $1`,
            [id]
        );

        res.json(taskWithUsers.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE task_id = $1', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.assignTask = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, user_id]
        );

        // Notify user
        const task = await pool.query('SELECT title FROM tasks WHERE task_id = $1', [id]);
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [user_id, `You have been assigned to task: ${task.rows[0].title}`]
        );

        res.json({ message: 'User assigned to task' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unassignTask = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
        await pool.query(
            'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2',
            [id, user_id]
        );
        res.json({ message: 'User unassigned from task' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
