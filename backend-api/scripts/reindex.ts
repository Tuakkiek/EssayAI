import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  console.log(`Connecting to database...`);
  await mongoose.connect(MONGO_URI as string);
  console.log("Connected");

  const usersCollection = mongoose.connection.db!.collection("users");

  try {
    await usersCollection.dropIndex("email_1");
    console.log("Dropped index email_1");
  } catch (e: any) {
    console.log("Could not drop email_1 index:", e.message);
  }

  try {
    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log("Created index email_1 (unique, sparse)");
  } catch (e: any) {
    console.error("Error creating email index:", e.message);
  }

  try {
    await usersCollection.createIndex({ phone: 1 }, { unique: true });
    console.log("Created index phone_1 (unique)");
  } catch (e: any) {
    console.error("Error creating phone index:", e.message);
  }

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
