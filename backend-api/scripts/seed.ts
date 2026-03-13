/**
 * scripts/seed.ts
 * Delete all users (and related collections) then create 4 test accounts.
 *
 * Run (from backend-api):
 *   npx ts-node scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ielts_db";

async function seed() {
  console.log(`Connecting to: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected");

  // Delete users + related collections
  await User.deleteMany({});
  try {
    await mongoose.connection.db!.collection("essays").deleteMany({});
    await mongoose.connection.db!.collection("classes").deleteMany({});
    await mongoose.connection.db!.collection("assignments").deleteMany({});
    await mongoose.connection.db!.collection("centers").deleteMany({});
  } catch {
    // ignore missing collections
  }

  const passwordHash = await bcrypt.hash("123123", 10);

  await User.insertMany([
    {
      name: "Test Free Student",
      phone: "111",
      passwordHash,
      role: "free_student",
      centerId: null,
      registrationMode: "self",
      mustChangePassword: false,
      isActive: true,
      selfSubscription: { plan: "individual_free", isActive: true },
      stats: { essaysSubmitted: 0, averageScore: 0 },
    },
    {
      name: "Test Center Student",
      phone: "222",
      passwordHash,
      role: "center_student",
      centerId: null,
      registrationMode: "invited",
      mustChangePassword: false,
      isActive: true,
      stats: { essaysSubmitted: 0, averageScore: 0 },
    },
    {
      name: "Test Teacher",
      phone: "333",
      passwordHash,
      role: "teacher",
      centerId: null,
      registrationMode: "self",
      mustChangePassword: false,
      isActive: true,
      stats: { essaysSubmitted: 0, averageScore: 0 },
    },
    {
      name: "Test Admin",
      phone: "444",
      passwordHash,
      role: "admin",
      centerId: null,
      registrationMode: "system",
      mustChangePassword: false,
      isActive: true,
      stats: { essaysSubmitted: 0, averageScore: 0 },
    },
  ]);

  console.log("Created 4 test users:");
  console.log("  111 -> free_student  | pw: 123123");
  console.log("  222 -> center_student | pw: 123123");
  console.log("  333 -> teacher        | pw: 123123");
  console.log("  444 -> admin          | pw: 123123");

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
