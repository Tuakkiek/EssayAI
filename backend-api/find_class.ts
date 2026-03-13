import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { Class, User } from "./src/models/index";

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/essayai";
  await mongoose.connect(uri);
  
  try {
    const className = "VSTEP-01-03-26";
    const cls = await Class.findOne({ name: className });
    
    if (!cls) {
      console.log(`Class "${className}" not found. Listing all classes:`);
      const allClasses = await Class.find({}, "name _id");
      allClasses.forEach(c => console.log(`- ${c.name} (${c._id})`));
    } else {
      console.log(`Found Class "${className}": ${cls._id}`);
      console.log(`Teacher ID: ${cls.teacherId}`);
      console.log(`Center ID: ${cls.centerId}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
