import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";
import { env } from "./config/env";

dotenv.config();

const PORT = env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Setu AI Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();