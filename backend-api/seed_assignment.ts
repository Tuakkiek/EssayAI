import mongoose from "mongoose";
import { Class, User, Assignment } from "./src/models/index";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  try {
    const cls = await Class.findOne({ name: { $regex: /^A1$/i } });
    if (!cls) {
      console.error("Class A1 not found!");
      process.exit(1);
    }
    
    console.log(`Found Class A1: ${cls._id}`);
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    
    const assignment = await Assignment.create({
      centerId: cls.centerId,
      classId: cls._id,
      teacherId: cls.teacherId,
      title: "Task 2 Writing Practice: Technology",
      description: "Write an essay discussing the impact of technology on society.",
      taskType: "task2",
      prompt: "Some people think that technology makes our lives more complex, while others believe it simplifies things. Discuss both views and give your own opinion.",
      status: "published",
      dueDate: dueDate,
      maxAttempts: 3,
      gradingCriteria: {
        overview: "Ensure to discuss both views and give a clear opinion.",
        requiredVocabulary: [
          { word: "technology", importance: "required" },
          { word: "complex", importance: "required" },
          { word: "simplify", importance: "recommended" }
        ],
        bandDescriptors: [],
        structureRequirements: "Introduction, 2 body paragraphs, Conclusion.",
        penaltyNotes: "Word count under 250 words.",
        additionalNotes: ""
      }
    });
    
    console.log("Assignment created successfully:", assignment._id);
  } catch (error) {
    console.error("Error creating assignment:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
