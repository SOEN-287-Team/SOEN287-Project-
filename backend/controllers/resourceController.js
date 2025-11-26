const Resource = require('../models/resourceModel');

exports.list = async (req, res) => {
  try {
    const rows = await Resource.getAllResources();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const row = await Resource.getResourceById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const id = await Resource.createResource(req.body);
    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};