import "dotenv/config";
import express from "express";
import mongoose, { mongo } from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import userRoutes from "./routes/userRoutes/userRoutes.js";
import projectRoutes from "./routes/projectDetRoutes/projectDetRoutes.js";

const app = express();
// dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ["http://localhost:5175"];
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

const MONGO_URL = "mongodb://127.0.0.1:27017/DHS-Admin";
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

app.use("/", userRoutes);
app.use("/project", projectRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
