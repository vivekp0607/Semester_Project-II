// seed.js

const mongoose = require("mongoose");
const Cargo = require("./models/cargo");  // Assuming the model is in a separate file

mongoose.connect("mongodb://localhost:27017/cargoDashboard", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Seed data
    const cargoData = new Cargo({
      totalCargo: 120,
      inTransit: 50,
      delivered: 70
    });
    await cargoData.save();
    console.log("Database seeded");
    mongoose.connection.close();
  })
  .catch((err) => console.error("Error connecting to MongoDB", err));
