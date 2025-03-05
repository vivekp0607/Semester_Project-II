// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Create an Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // to parse JSON data

// Connect to MongoDB (Replace with your MongoDB connection string)
mongoose.connect("mongodb://localhost:27017/cargoDashboard", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Define schema and model for cargo data
const cargoSchema = new mongoose.Schema({
  totalCargo: Number,
  inTransit: Number,
  delivered: Number
});

const Cargo = mongoose.model("Cargo", cargoSchema);

// API Route to get cargo data
app.get("/api/dashboard", async (req, res) => {
  try {
    const cargoData = await Cargo.findOne(); // Fetch the first document
    res.json(cargoData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

// Set up server to listen on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
