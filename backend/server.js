const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Unified PaperVault Express application (includes Auth, Papers, GridFS, and AI Exam Paper Generator)
const app = require('../frontend/netlify/functions/api.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
