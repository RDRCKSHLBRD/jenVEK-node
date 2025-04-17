// jenVek-node/server/routes/views.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Route to serve the main HTML page
router.get('/', (req, res) => {
  // Construct the absolute path to the index.html file
  const indexPath = path.join(__dirname, '..', 'views', 'index.html');
  res.sendFile(indexPath);
});

module.exports = router;