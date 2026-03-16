const pool = require('../config/db');

exports.getColumns = async (req, res) => {
    const { boardId } = req.params;
    try {
        const columns = await pool.query(
            'SELECT "columnId", "boardId", name, position, "createdAt" FROM "Columns" WHERE "boardId" = $1 ORDER BY position ASC',
            [boardId]
        );
        res.json(columns.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createColumn = async (req, res) => {
    const { boardId } = req.params;
    const { name, position } = req.body;
    try {
        const newColumn = await pool.query(
            'INSERT INTO "Columns" ("boardId", name, position) VALUES ($1, $2, $3) RETURNING *',
            [boardId, name, position]
        );
        res.status(201).json(newColumn.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateColumn = async (req, res) => {
    const { id } = req.params;
    const { name, position } = req.body;
    try {
        const updatedColumn = await pool.query(
            'UPDATE "Columns" SET name = COALESCE($1, name), position = COALESCE($2, position) WHERE "columnId" = $3 RETURNING *',
            [name, position, id]
        );
        res.json(updatedColumn.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteColumn = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM "Columns" WHERE "columnId" = $1', [id]);
        res.json({ message: 'Column deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
