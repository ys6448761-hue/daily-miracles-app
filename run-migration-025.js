require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("localhost") ? false : { rejectUnauthorized: false }
});

async function run() {
    try {
        const sqlPath = path.join(__dirname, "database", "migrations", "025_wish_challenges.sql");
        const sql = fs.readFileSync(sqlPath, "utf-8");
        console.log("Running migration...");
        await pool.query(sql);
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        await pool.end();
    }
}

run();
