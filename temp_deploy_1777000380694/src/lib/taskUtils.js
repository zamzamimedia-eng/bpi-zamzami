import pool from '@/lib/db';

export async function ensureTasksSchema() {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM tasks LIKE "description"');
        if (columns.length === 0) {
            console.log('> DB Auto-Fix: Adding description column to tasks table');
            await pool.query('ALTER TABLE tasks ADD COLUMN description TEXT AFTER title');
        }

        const [nodeIdCol] = await pool.query('SHOW COLUMNS FROM tasks LIKE "source_node_id"');
        if (nodeIdCol.length === 0) {
            console.log('> DB Auto-Fix: Adding source_node_id column to tasks table');
            await pool.query('ALTER TABLE tasks ADD COLUMN source_node_id VARCHAR(100) AFTER project_id');
            await pool.query('CREATE INDEX idx_source_node ON tasks(source_node_id)');
        }
    } catch (err) {
        console.warn('> DB Auto-Fix Warning:', err.message);
    }
}

export function sanitizeTaskData(data) {
    const sanitized = { ...data };
    
    // Convert ISO dates or empty strings to NULL or YYYY-MM-DD
    if (sanitized.deadline) {
        try {
            const date = new Date(sanitized.deadline);
            if (!isNaN(date.getTime())) {
                sanitized.deadline = date.toISOString().split('T')[0];
            } else {
                sanitized.deadline = null;
            }
        } catch (e) {
            sanitized.deadline = null;
        }
    } else {
        sanitized.deadline = null;
    }

    return sanitized;
}

/**
 * Automatically update project status based on task statuses:
 * - 'completed': All tasks are 'done' (at least 1 task must exist)
 * - 'executing': At least one task is 'doing' or 'done' (but not all are 'done')
 * - 'draft': All tasks are 'todo' or no tasks exist
 */
export async function updateProjectStatus(projectId) {
    if (!projectId) return;

    try {
        const [tasks] = await pool.query('SELECT status FROM tasks WHERE project_id = ?', [projectId]);
        
        console.log(`> Auto-Status [Project ${projectId}]: Found ${tasks.length} tasks.`);
        
        let newStatus = 'draft';

        if (tasks.length > 0) {
            const statuses = tasks.map(t => (t.status || '').trim().toLowerCase());
            const allDone = statuses.every(s => s === 'done');
            const anyInProgress = statuses.some(s => s === 'doing' || s === 'done');

            console.log(`> Auto-Status [Project ${projectId}]: Statuses: ${JSON.stringify(statuses)}`);

            if (allDone) {
                newStatus = 'completed';
            } else if (anyInProgress) {
                newStatus = 'executing';
            } else {
                // If tasks exist but none started, it's analyzing (mapped but not yet fixed)
                newStatus = 'analyzing';
            }
        } else {
            newStatus = 'draft';
        }

        console.log(`> Auto-Status [Project ${projectId}]: Final Decision -> ${newStatus}`);
        await pool.query('UPDATE projects SET status = ? WHERE id = ?', [newStatus, projectId]);
        
        return newStatus;
    } catch (error) {
        console.error('> Auto-Status Error:', error);
    }
}
