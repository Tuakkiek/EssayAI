import mongoose from "mongoose";
import * as dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ielts_db";

async function run() {
  console.log(`Connecting to: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected");

  try {
    const usersCollection = mongoose.connection.db!.collection("users");
    await usersCollection.deleteMany({});
    console.log("Deleted all existing users to avoid index duplication.");
    await usersCollection.dropIndex("email_1");
    console.log("Dropped index email_1");
  } catch (e: any) {
    console.log("Could not drop email_1 index:", e.message);
  }

  try {
    const usersCollection = mongoose.connection.db!.collection("users");
    // Explicitly create the new indexes using native driver
    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log("Created index email_1 (unique, sparse)");
    await usersCollection.createIndex({ phone: 1 }, { unique: true });
    console.log("Created index phone_1 (unique)");
  } catch (e: any) {
    console.error("Error creating indexes:", e.message);
  }

  // Also sync mongoose indexes manually just in case
  await User.syncIndexes();
  console.log("Mongoose indexes synced");

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
