const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'quizzify',
});

async function verify() {
  try {
    await client.connect();
    console.log('--- Connected to database ---');

    // 1. Check questions table schema
    console.log('\n--- Checking questions table columns ---');
    const questionsSchema = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      ORDER BY ordinal_position
    `);
    console.log('Questions table columns:');
    questionsSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // 2. Check migration history
    console.log('\n--- Checking migration history ---');
    try {
      const migrations = await client.query(`
        SELECT id, name, "runOn" 
        FROM migrations 
        ORDER BY id DESC
      `);
      console.log('Migration history:');
      migrations.rows.forEach(row => {
        console.log(`  - ${row.name} (run at: ${row.runOn})`);
      });
      
      // Check if our migration is there
      const targetMigrationName = '1781968058926-RenameQuestionText';
      const foundMigration = migrations.rows.find(r => r.name.includes(targetMigrationName));
      if (foundMigration) {
        console.log(`\n✅ Migration ${targetMigrationName} IS EXECUTED!`);
      } else {
        console.log(`\n❌ Migration ${targetMigrationName} is NOT executed!`);
      }
    } catch (e) {
      console.log('Could not check migration history (maybe different table name?):', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verify();
