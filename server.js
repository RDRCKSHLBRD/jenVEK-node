// jenVek-node/server.js

const express = require('express');
const path = require('path');
const apiRoutes = require('./server/routes/api');
const viewRoutes = require('./server/routes/views');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files (CSS, client-side JS, assets)
// Express will automatically look for files in the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Register API routes (prefix with /api)
app.use('/api', apiRoutes);

// Register View routes (for serving HTML)
app.use('/', viewRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});