import mongoose from "mongoose";

const connectDB = async () => {
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt === maxRetries) {
        console.error("All MongoDB connection attempts failed. The server is running but database operations will fail.");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

export default connectDB;
