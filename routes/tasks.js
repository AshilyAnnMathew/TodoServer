const express = require('express');
const router = express.Router();

// GET /api/tasks
router.get('/', async (req, res) => {
    try {
        const { status, priority } = req.query;
        let query = req.supabase
            .from('tasks')
            .select('*')
            .eq('user_id', req.user.id);

        if (status) {
            query = query.eq('status', status);
        }
        if (priority) {
            query = query.eq('priority', priority);
        }

        // Sort: Pending first, then Priority (High, Medium, Low), then Created At
        // Note: Complex sorting might be easier in JS or robust SQL. 
        // Supabase simple sorting:
        // We can sort by status (Pending > Done), then Priority, then created_at.
        // Mapping Priority to number might be needed for 'High > Medium > Low' if text.
        // For now, let's fetch and sort in JS or use basic sorting.
        // Let's rely on basic sorting for MVP: Created At desc.
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Custom sorting as per requirements
        // 1. Pending tasks first, then Done
        // 2. Within Pending, sort by Priority (High → Medium → Low)
        // 3. Within same priority, latest created first (already handled by default query if we sort there, but mixed with Status/Priority is tricky in single SQL without custom order)

        // Helper for priority value
        const getPriorityVal = (p) => {
            if (p === 'High') return 3;
            if (p === 'Medium') return 2;
            return 1;
        };

        data.sort((a, b) => {
            // 1. Status
            if (a.status === 'Pending' && b.status !== 'Pending') return -1;
            if (a.status !== 'Pending' && b.status === 'Pending') return 1;

            // 2. Priority (Create custom sort value)
            if (a.status === 'Pending') {
                return getPriorityVal(b.priority) - getPriorityVal(a.priority);
            }
            return 0;
        });

        res.json(data);
    } catch (err) {
        console.error('Error in GET /api/tasks:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tasks
router.post('/', async (req, res) => {
    try {
        const { title, description, priority, due_date } = req.body;

        if (!title || !priority) {
            return res.status(400).json({ error: 'Title and Priority are required' });
        }

        console.log('Creating task for user:', req.user.id);
        console.log('Task data:', { title, description, priority, due_date });

        const { data, error } = await req.supabase
            .from('tasks')
            .insert([
                {
                    user_id: req.user.id,
                    title,
                    description,
                    priority,
                    due_date,
                    status: 'Pending'
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Security: Ensure task belongs to user
        // We can do this by adding .eq('user_id', req.user.id) to the update query
        const { data, error } = await req.supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        }

        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
