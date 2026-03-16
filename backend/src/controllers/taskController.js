const pool = require('../config/db');

exports.getTasks = async (req, res) => {
    const { columnId } = req.params;
    try {
        const tasks = await pool.query(
            'SELECT "taskId", "columnId", title, description, position, tags, "createdAt" FROM "Tasks" WHERE "columnId" = $1 ORDER BY position ASC',
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
            'INSERT INTO "Tasks" ("columnId", title, description, position, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [columnId, title, description, position, tags]
        );
        res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, position, columnId, tags } = req.body;
    try {
        const updatedTask = await pool.query(
            `UPDATE "Tasks" SET 
                title = COALESCE($1, title), 
                description = COALESCE($2, description), 
                position = COALESCE($3, position), 
                "columnId" = COALESCE($4, "columnId"),
                tags = COALESCE($5, tags)
             WHERE "taskId" = $6 RETURNING *`,
            [title, description, position, columnId, tags, id]
        );
        res.json(updatedTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTask = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM "Tasks" WHERE "taskId" = $1', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.assignTask = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    try {
        await pool.query(
            'INSERT INTO "TaskAssignments" ("taskId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, userId]
        );

        // Notify user
        const task = await pool.query('SELECT title FROM "Tasks" WHERE "taskId" = $1', [id]);
        await pool.query(
            'INSERT INTO "Notifications" ("userId", message) VALUES ($1, $2)',
            [userId, `You have been assigned to task: ${task.rows[0].title}`]
        );

        res.json({ message: 'User assigned to task' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
