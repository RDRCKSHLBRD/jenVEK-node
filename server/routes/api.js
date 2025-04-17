// jenVek-node/server/routes/api.js
const express = require('express');
const router = express.Router();
const colorData = require('../data/colours'); // Import the node module

// Endpoint to get all color data
router.get('/colors', (req, res) => {
  res.json(colorData); // Send the imported data as JSON
});

module.exports = router;