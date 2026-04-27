const mysql = require('mysql2/promise');

async function checkImpact() {
    // Try connection with host first for Windows environment
    const poolConfig = {
        host: '127.0.0.1',
        user: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V',
        database: 'ponp9455_bpi',
    };

    try {
        const pool = await mysql.createConnection(poolConfig);
        
        console.log('--- Analisis Dampak Data RCA (Database: ponp9455_bpi) ---');
        
        // 1. Total Proyek
        const [totalProjects] = await pool.query('SELECT COUNT(*) as count FROM projects');
        console.log('Total Seluruh Proyek:', totalProjects[0].count);

        // 2. Proyek dengan Peta Proses
        const [totalMaps] = await pool.query('SELECT COUNT(*) as count FROM process_maps');
        console.log('Proyek dengan Peta Proses:', totalMaps[0].count);

        // 3. Proyek yang sudah memiliki data RCA di Database
        const [mapsWithRca] = await pool.query('SELECT COUNT(DISTINCT process_map_id) as count FROM root_cause_analysis');
        console.log('Proyek yang BERHASIL menyimpan RCA:', mapsWithRca[0].count);

        // 4. Proyek yang kemungkinan besar SEHARUSNYA punya RCA tapi kosong
        // Kriterianya: Punya to_be_json (berarti sudah disimulasi) tapi RCA 0
        const [potentialLost] = await pool.query(`
            SELECT pm.id as pmap_id, pm.project_id, p.name 
            FROM process_maps pm
            JOIN projects p ON pm.project_id = p.id
            WHERE pm.id NOT IN (SELECT DISTINCT process_map_id FROM root_cause_analysis)
            AND (pm.to_be_json IS NOT NULL OR p.status = 'analyzing')
        `);
        console.log('\n--- Daftar Proyek Terdampak (Analisis Kosong) ---');
        console.log(`Jumlah proyek terdampak: ${potentialLost.length}`);
        potentialLost.forEach(p => console.log(`- ID Proyek: ${p.project_id} | ID Map: ${p.pmap_id} | Nama: ${p.name}`));

        await pool.end();
    } catch (err) {
        console.error('Debug Error:', err);
    }
}

checkImpact();
