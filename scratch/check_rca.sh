#!/bin/bash
DB_USER='ponp9455_bpi'
DB_PASS='ponp_bpi_123'
DB_NAME='ponp9455_bpi'
SOCKET='/tmp/mysql.sock'

echo "--- Analisis Dampak RCA ---"
mysql -u $DB_USER -p"$DB_PASS" -S $SOCKET -e "USE $DB_NAME; 
SELECT 'Total entri RCA di DB' as label, COUNT(*) as count FROM root_cause_analysis;
SELECT 'Proyek dengan Peta Proses' as label, COUNT(*) as count FROM process_maps;
SELECT 'Proyek yang BERHASIL simpan RCA' as label, COUNT(DISTINCT process_map_id) as count FROM root_cause_analysis;
SELECT 'Proyek terdampak (SUDAH analisis tapi RCA KOSONG)' as label, COUNT(*) as count 
FROM process_maps pm 
JOIN projects p ON pm.project_id = p.id 
WHERE pm.id NOT IN (SELECT DISTINCT process_map_id FROM root_cause_analysis)
AND (pm.to_be_json IS NOT NULL OR p.status = 'analyzing');"
