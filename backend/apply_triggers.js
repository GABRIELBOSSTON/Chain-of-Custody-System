const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  let connection;
  try {
    console.log('Connecting to database...', process.env.DATABASE_URL);
    // Parse DATABASE_URL for mysql2 (mysql://root:@localhost:3306/chain_of_custody)
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('Applying MariaDB triggers...');
    
    await connection.query(`DROP TRIGGER IF EXISTS prevent_audit_log_update`);
    await connection.query(`DROP TRIGGER IF EXISTS prevent_audit_log_delete`);

    await connection.query(`
      CREATE TRIGGER prevent_audit_log_update
      BEFORE UPDATE ON audit_logs
      FOR EACH ROW
      BEGIN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Updates are not allowed on audit_logs table';
      END;
    `);

    await connection.query(`
      CREATE TRIGGER prevent_audit_log_delete
      BEFORE DELETE ON audit_logs
      FOR EACH ROW
      BEGIN
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletes are not allowed on audit_logs table';
      END;
    `);

    console.log('Triggers applied successfully!');
  } catch (err) {
    console.error('Failed to apply triggers:', err);
  } finally {
    if (connection) await connection.end();
  }
}

main();
