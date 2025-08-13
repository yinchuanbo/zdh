const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Import the app creation function
const createApp = require("../app");

// Create the app instance
const app = createApp();

// Export the app for Vercel
module.exports = app;