// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const stockRoutes = require("./routes/stockRoutes");
const { connectDB } = require("./config/database");
const cors = require("cors");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;
// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Add logging middleware to see all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// Basic Routes
console.log("Server: Registering basic routes...");
app.use(basicRoutes);

// Stock API Routes
console.log("Server: Registering stock routes at /api/stocks...");
try {
  app.use('/api/stocks', stockRoutes);
  console.log("Server: Stock routes registered successfully");
} catch (error) {
  console.error("Server: Error registering stock routes:", error);
}

// Add a test route to verify the server is working
app.get('/api/test', (req, res) => {
  console.log("Server: Test route hit");
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// List all registered routes for debugging
console.log("Server: Registered routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`  Router middleware: ${middleware.regexp}`);
    if (middleware.handle && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`    ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  }
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  console.log(`Server: 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Server: Ready to accept requests`);
});