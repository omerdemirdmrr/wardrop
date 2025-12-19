import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connection is succesful!"))
  .catch((err) => console.log("MongoDB connection error!:", err));

// Test endpoint
app.get("/", (req, res) => {
  res.send("Combine backend is running!");
});

// Auth route
// Auth route
app.use("/auth", authRoutes);

import userRoutes from "./routes/user.js";
app.use("/user", userRoutes);

// New Routes
import clothingRoutes from "./routes/clothingRoutes.js";
import outfitRoutes from "./routes/outfitRoutes.js";

app.use("/clothes", clothingRoutes);
app.use("/outfits", outfitRoutes);

// Static files for images
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));


