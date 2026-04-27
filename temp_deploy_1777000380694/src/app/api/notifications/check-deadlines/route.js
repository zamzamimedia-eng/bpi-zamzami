import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createNotification } from '@/lib/notifications';

/**
 * GET /api/notifications/check-deadlines
 * Cron-like endpoint: checks all canvas nodes for overdue norm_time deadlines
 * and sends notifications to the relevant PIC (project actor/creator).
 * This endpoint should be called periodically (e.g., every 15 minutes via a cron job or client-side polling).
 */
export async function GET() {
    try {
        // Fetch all process maps with their project info
        const [maps] = await pool.query(`
            SELECT pm.id, pm.project_id, pm.canvas_json, p.name as project_name, p.actor_id, p.created_by, p.pic,
                   a.name as actor_name
            FROM process_maps pm
            JOIN projects p ON pm.project_id = p.id
            LEFT JOIN actors a ON p.actor_id = a.id
        `);

        let notificationsCreated = 0;
        const now = new Date();

        for (const map of maps) {
            if (!map.canvas_json) continue;

            let parsed;
            try {
                parsed = typeof map.canvas_json === 'string' ? JSON.parse(map.canvas_json) : map.canvas_json;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            } catch (e) {
                continue;
            }

            if (!parsed?.nodes) continue;

            for (const node of parsed.nodes) {
                if (node.type !== 'process' || !node.data?.normTime) continue;

                const deadline = new Date(node.data.normTime);
                if (isNaN(deadline.getTime())) continue;

                // Check if deadline has passed or is within 1 hour
                const diffMs = deadline - now;
                const diffMins = diffMs / (1000 * 60);

                // Skip if deadline is more than 60 minutes away or already notified (more than 24h ago)
                if (diffMins > 60) continue;
                if (diffMins < -1440) continue; // Don't notify for deadlines older than 24h

                // Check if we already sent a notification for this specific node+deadline combo (avoid duplicates)
                const notifKey = `norm_deadline_${map.project_id}_${node.id}`;
                const [existing] = await pool.query(
                    "SELECT id FROM notifications WHERE title = ? AND created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR) LIMIT 1",
                    [notifKey]
                );
                if (existing.length > 0) continue;

                // Determine message
                const stepName = node.data.action || node.data.label || 'Langkah Proses';
                const picName = node.data.role || map.actor_name || map.pic || 'PIC';
                const deadlineStr = deadline.toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                let description;
                let type;
                if (diffMins <= 0) {
                    // Overdue
                    description = `⏰ WAKTU HABIS! Langkah "${stepName}" pada proyek "${map.project_name}" sudah melewati norm waktu (${deadlineStr}). PIC: ${picName}`;
                    type = 'danger';
                } else {
                    // Approaching (within 1 hour)
                    description = `⚠️ PERHATIAN! Langkah "${stepName}" pada proyek "${map.project_name}" akan mencapai norm waktu dalam ${Math.round(diffMins)} menit (${deadlineStr}). PIC: ${picName}`;
                    type = 'warning';
                }

                // Send notification to project creator
                if (map.created_by) {
                    await createNotification({
                        userId: map.created_by,
                        title: notifKey,
                        description,
                        type
                    });
                    notificationsCreated++;
                }

                // Also notify all admins
                const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
                for (const admin of admins) {
                    if (admin.id === map.created_by) continue; // Don't double-notify
                    await createNotification({
                        userId: admin.id,
                        title: notifKey,
                        description,
                        type
                    });
                    notificationsCreated++;
                }
            }
        }

        return NextResponse.json({ 
            message: `Deadline check complete. ${notificationsCreated} notifications created.`,
            count: notificationsCreated 
        });
    } catch (error) {
        console.error('Check deadlines error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
