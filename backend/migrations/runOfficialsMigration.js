import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;

  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "kp_bbpmp_db",
      multipleStatements: true,
    });

    console.log("✅ Connected to database");

    // Read migration file
    const migrationPath = path.join(__dirname, "add_officials_table.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("🔄 Running officials table migration...");

    // Execute migration
    await connection.query(sql);

    console.log("✅ Officials table migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("📊 Database connection closed");
    }
  }
}

runMigration();
