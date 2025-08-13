import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MONGODB_URI is not defined in environment variables.");
    }

    await mongoose.connect(uri, {
      dbName: "MOH", // Set DB name here, do NOT append to URI
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDatabase;
