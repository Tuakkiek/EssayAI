import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const centers = await mongoose.connection.collection("centers").find({}, { projection: { _id: 1, name: 1, ownerId: 1 } }).toArray();
  console.log("Centers in DB:");
  console.log(centers);
  
  await mongoose.disconnect();
}
run().catch(console.error);
