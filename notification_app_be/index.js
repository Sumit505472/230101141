import express from "express";
import dotenv from "dotenv";
import loggingMiddleware, {
  errorLoggingMiddleware,
  Log,
} from "../logging_middleware/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(loggingMiddleware);

app.get("/health", async (req, res) => {
  await Log(
    "backend",
    "debug",
    "route",
    "Health check route executed successfully"
  );

  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use(errorLoggingMiddleware);

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  await Log(
    "backend",
    "info",
    "handler",
    `Server started successfully on port ${PORT}`
  );
});
