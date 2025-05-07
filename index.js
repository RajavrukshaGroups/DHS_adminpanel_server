import "dotenv/config";
import express from "express";
import mongoose, { mongo } from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import userRoutes from "./routes/userRoutes/userRoutes.js";
import projectRoutes from "./routes/projectDetRoutes/projectDetRoutes.js";
import connectDB from "./config/db.js";
import memberRoutes from "./routes/memberRoutes/memberRoutes.js";

const app = express();
// dotenv.config();
app.use(express.json());
connectDB();
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ["http://localhost:5173"];
// const allowedOrigins = ["http://localhost:5175"];

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

app.use("/admin", userRoutes);
app.use("/project", projectRoutes);
app.use("/member",memberRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
