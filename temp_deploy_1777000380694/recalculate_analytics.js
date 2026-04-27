require('dotenv').config();
const pool = require('./src/lib/db.js').default;

async function recalculate() {
    try {
        console.log('--- Starting Analytics Recalculation ---');
        const [rows] = await pool.query('SELECT project_id, canvas_json FROM process_maps');
        
        console.log(`Found ${rows.length} process maps to process.`);

        for (const row of rows) {
            const projectId = row.project_id;
            let canvasJson = row.canvas_json;
            if (typeof canvasJson === 'string') {
                try {
                    canvasJson = JSON.parse(canvasJson);
                } catch (e) {
                    console.error(`Failed to parse JSON for project ${projectId}`);
                    continue;
                }
            }

            let totalSteps = 0;
            let bottlenecks = 0;
            let potentialSavingTime = 0;
            let potentialSavingCost = 0;

            if (canvasJson && canvasJson.nodes) {
                const nodes = canvasJson.nodes;
                totalSteps = nodes.length;

                const getMins = (n) => {
                    const d = n.data?.duration || 0;
                    const unit = n.data?.durationUnit || 'menit';
                    if (unit === 'jam') return d * 60;
                    if (unit === 'hari') return d * 480;
                    return d;
                };

                const processNodes = nodes.filter(n => n.type === 'process' && getMins(n) > 0);
                const totalMins = processNodes.reduce((sum, n) => sum + getMins(n), 0);
                
                if (processNodes.length > 0) {
                    const durations = processNodes.map(n => getMins(n)).sort((a, b) => a - b);
                    const threshold80 = durations[Math.floor(durations.length * 0.8)] || durations[durations.length - 1];
                    
                    const bottleneckNodes = processNodes.filter(n => getMins(n) >= threshold80);
                    bottlenecks = bottleneckNodes.length;

                    const savedMins = bottleneckNodes.reduce((sum, n) => sum + (getMins(n) * 0.5), 0);
                    
                    if (totalMins > 0) {
                        potentialSavingTime = Math.round((savedMins / totalMins) * 100);
                        potentialSavingCost = savedMins * 5000 * 20;
                    }
                }
            }

            console.log(`Updating Project ${projectId}: Steps=${totalSteps}, BN=${bottlenecks}, Save%=${potentialSavingTime}, Cost=${potentialSavingCost}`);
            
            await pool.query(
                `UPDATE projects SET 
                    total_steps = ?, 
                    bottlenecks = ?, 
                    potential_saving_time = ?, 
                    potential_saving_cost = ? 
                 WHERE id = ?`,
                [totalSteps, bottlenecks, potentialSavingTime, potentialSavingCost, projectId]
            );
        }
        
        console.log('--- Recalculation Finished ---');
        process.exit(0);
    } catch (err) {
        console.error('Recalculation failed:', err);
        process.exit(1);
    }
}

recalculate();
