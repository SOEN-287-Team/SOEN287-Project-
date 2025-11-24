const db = require('../db'); // expects { connection, query } exported

async function getAllResources() {
  // if your db.query returns results only (not [rows,fields]), adjust accordingly
  return await db.query('SELECT * FROM resources');
}

async function getResourceById(id) {
  const rows = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
  return rows[0];
}

async function createResource(resource) {
  const { name, type, location, capacity, status } = resource;
  const result = await db.query(
    'INSERT INTO resources (name, type, location, capacity, status) VALUES (?, ?, ?, ?, ?)',
    [name, type, location, capacity, status]
  );
  return result.insertId;
}

module.exports = { getAllResources, getResourceById, createResource };