
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/setu-ai");
  const user = await User.findOne();
  if (!user) {
    console.log("No user found");
    process.exit(0);
  }
  try {
    user.consent_given = true;
    user.consent_timestamp = new Date() as any;
    await user.save();
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();

