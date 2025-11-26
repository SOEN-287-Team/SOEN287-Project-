const db = require('./db');

async function showSchema() {
  try {
    console.log('=== TABLES ===');
    const [tables] = await db.execute('SHOW TABLES');
    console.log(tables);
    
    console.log('\n=== BOOKINGS TABLE ===');
    const [bookings] = await db.execute('DESCRIBE bookings');
    console.log(bookings);
    
    console.log('\n=== RESOURCES TABLE ===');
    const [resources] = await db.execute('DESCRIBE resources');
    console.log(resources);
    
    console.log('\n=== USERS TABLE ===');
    const [users] = await db.execute('DESCRIBE users');
    console.log(users);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

showSchema();