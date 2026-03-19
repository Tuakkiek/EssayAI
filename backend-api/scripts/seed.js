"use strict";
/**
 * scripts/seed.ts
 * Delete all users (and related collections) then create 4 test accounts.
 *
 * Run (from backend-api):
 *   npx ts-node scripts/seed.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv = __importStar(require("dotenv"));
const User_1 = __importDefault(require("../src/models/User"));
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ielts_db";
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Connecting to: ${MONGO_URI}`);
        yield mongoose_1.default.connect(MONGO_URI);
        console.log("Connected");
        // Delete users + related collections
        yield User_1.default.deleteMany({});
        try {
            yield mongoose_1.default.connection.db.collection("essays").deleteMany({});
            yield mongoose_1.default.connection.db.collection("classes").deleteMany({});
            yield mongoose_1.default.connection.db.collection("assignments").deleteMany({});
            yield mongoose_1.default.connection.db.collection("centers").deleteMany({});
        }
        catch (_a) {
            // ignore missing collections
        }
        const passwordHash = yield bcryptjs_1.default.hash("123123", 10);
        yield User_1.default.insertMany([
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
        yield mongoose_1.default.disconnect();
        console.log("Done");
    });
}
seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
