const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'quizzify',
});
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM quiz_results'))
  .then(res => {
    console.log('Results count:', res.rows[0]);
    return client.query('SELECT * FROM quiz_results LIMIT 10');
  })
  .then(res => {
    console.log('Results:', res.rows);
    return client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
