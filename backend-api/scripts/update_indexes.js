"use strict";
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
const dotenv = __importStar(require("dotenv"));
const User_1 = __importDefault(require("../src/models/User"));
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ielts_db";
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Connecting to: ${MONGO_URI}`);
        yield mongoose_1.default.connect(MONGO_URI);
        console.log("Connected");
        try {
            const usersCollection = mongoose_1.default.connection.db.collection("users");
            yield usersCollection.deleteMany({});
            console.log("Deleted all existing users to avoid index duplication.");
            yield usersCollection.dropIndex("email_1");
            console.log("Dropped index email_1");
        }
        catch (e) {
            console.log("Could not drop email_1 index:", e.message);
        }
        try {
            const usersCollection = mongoose_1.default.connection.db.collection("users");
            // Explicitly create the new indexes using native driver
            yield usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
            console.log("Created index email_1 (unique, sparse)");
            yield usersCollection.createIndex({ phone: 1 }, { unique: true });
            console.log("Created index phone_1 (unique)");
        }
        catch (e) {
            console.error("Error creating indexes:", e.message);
        }
        // Also sync mongoose indexes manually just in case
        yield User_1.default.syncIndexes();
        console.log("Mongoose indexes synced");
        yield mongoose_1.default.disconnect();
        console.log("Done");
    });
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
