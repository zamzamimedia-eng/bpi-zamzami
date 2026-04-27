const mysql = require('mysql2/promise');

async function checkImpact() {
    const poolConfig = {
        host: 'localhost',
        user: 'ponp9455_bpi',
        password: 'ponp_bpi_123',
        database: 'ponp9455_bpi',
        socketPath: '/tmp/mysql.sock'
    };

    try {
        const pool = await mysql.createConnection(poolConfig);
        
        console.log('--- Analisis Dampak Data RCA (Server Local) ---');
        
        const [totalProjects] = await pool.query('SELECT COUNT(*) as count FROM projects');
        console.log('Total Proyek:', totalProjects[0].count);

        const [totalMaps] = await pool.query('SELECT COUNT(*) as count FROM process_maps');
        console.log('Proyek dengan Peta Proses:', totalMaps[0].count);

        const [mapsWithRca] = await pool.query('SELECT COUNT(DISTINCT process_map_id) as count FROM root_cause_analysis');
        console.log('Proyek dengan RCA Terdata:', mapsWithRca[0].count);

        const [potentialLost] = await pool.query(`
            SELECT p.id, p.name 
            FROM process_maps pm
            JOIN projects p ON pm.project_id = p.id
            WHERE pm.id NOT IN (SELECT DISTINCT process_map_id FROM root_cause_analysis)
            AND (pm.to_be_json IS NOT NULL OR p.status = 'analyzing')
        `);
        console.log('\n--- Proyek Terdampak (No RCA data) ---');
        console.log(`Jumlah: ${potentialLost.length}`);
        potentialLost.forEach(p => console.log(`- ${p.id}: ${p.name}`));

        await pool.end();
    } catch (err) {
        console.error('Debug Error:', err);
    }
}

checkImpact();
