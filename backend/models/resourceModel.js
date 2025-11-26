const db = require('../db'); 
// db = mysql2/promise pool => db.execute() kullanır

module.exports = {
  // GET all resources
  getAllResources: async () => {
    const [rows] = await db.execute('SELECT * FROM resources');
    return rows;
  },

  // GET one resource
  getResourceById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM resources WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  // POST create resource
  createResource: async (resource) => {
  const { name, type, location, capacity, status } = resource;

  const safeStatus = status || 'available';
  const safeCapacity = capacity !== undefined ? capacity : null;

  const [result] = await db.execute(
    `INSERT INTO resources (name, type, location, capacity, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, type, location, safeCapacity, safeStatus]
  );

  return result.insertId;
}, 
  // Update resource
updateResource: async (id, resource) => {
  const { name, type, location, capacity, status } = resource;
  
  const [result] = await db.execute(
    `UPDATE resources 
     SET name = ?, type = ?, location = ?, capacity = ?, status = ?
     WHERE id = ?`,
    [name, type, location, capacity, status, id]
  );
  
  return result.affectedRows > 0;
},

// Delete resource
deleteResource: async (id) => {
  const [result] = await db.execute('DELETE FROM resources WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
};
