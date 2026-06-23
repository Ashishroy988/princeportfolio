import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import adminRouter from "./routes/Admin.js";
import contactRouter from "./routes/Contact.js";
import portfolioRouter from "./routes/portfolio.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOrigins = new Set(
  clientOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const isAllowedDevOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  try {
    const { hostname, port: originPort } = new URL(origin);
    return originPort === "5173" && (hostname === "localhost" || hostname === "127.0.0.1" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname));
  } catch {
    return false;
  }
};


app.use(
  cors({
    origin(origin, callback) {
      if (allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected"
  });
});

app.use("/api/portfolio", portfolioRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);

app.use((error, _request, response, _next) => {
  console.error("API ERROR:", error);
  response.status(error.status || 500).json({
    message: error.message || "Server error"
  });
});

const startServer = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } catch (error) {
      console.warn("MongoDB connection failed. Contact messages will not be saved.");
      console.warn(error.message);
    }
  }

  app.listen(port, () => {
    console.log(`Portfolio API running on http://localhost:${port}`);
  });
};

startServer();
