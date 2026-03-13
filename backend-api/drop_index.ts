import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  try {
    const usersCollection = mongoose.connection.collection("users");
    await usersCollection.dropIndex("email_1");
    console.log("Successfully dropped email_1 index.");
  } catch (error: any) {
    if (error.code === 27) {
      console.log("Index email_1 does not exist, skipping.");
    } else {
      console.error("Error dropping index:", error);
    }
  }
  
  await mongoose.disconnect();
}
run().catch(console.error);
