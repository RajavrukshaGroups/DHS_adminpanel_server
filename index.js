import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes/userRoutes.js";
import projectRoutes from "./routes/projectDetRoutes/projectDetRoutes.js";
import connectDB from "./config/db.js";
import memberRoutes from "./routes/memberRoutes/memberRoutes.js";
import plotRoutes from "./routes/plotRoutes/plotRoutes.js";

import recieptRoutes from "./routes/receiptRoutes/receiptRoutes.js";

const app = express();

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Connect to DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,"public")));

const allowedOrigins = ["http://localhost:5173"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/admin", userRoutes);
app.use("/project", projectRoutes);
app.use("/member", memberRoutes);
app.use("/receipt", recieptRoutes);
app.use("/plot", plotRoutes);


// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
