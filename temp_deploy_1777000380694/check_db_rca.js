const pool = require('./src/lib/db').default;

async function run() {
  try {
    const [rows] = await pool.query("SHOW INDEX FROM root_cause_analysis");
    console.log("INDEXES:", rows);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

run();
