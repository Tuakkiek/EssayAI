"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./src/models/index");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URI);
    try {
        const cls = yield index_1.Class.findOne({ name: { $regex: /^A1$/i } });
        if (!cls) {
            console.error("Class A1 not found!");
            process.exit(1);
        }
        console.log(`Found Class A1: ${cls._id}`);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
        const assignment = yield index_1.Assignment.create({
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
    }
    catch (error) {
        console.error("Error creating assignment:", error);
    }
    finally {
        yield mongoose_1.default.disconnect();
    }
});
run();
