import "dotenv/config";
import express from "express";
import mongoose, { mongo } from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import userRoutes from "./routes/userRoutes/userRoutes.js"

const app = express();
// dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/", userRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});