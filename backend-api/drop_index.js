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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.MONGODB_URI);
        try {
            const usersCollection = mongoose_1.default.connection.collection("users");
            yield usersCollection.dropIndex("email_1");
            console.log("Successfully dropped email_1 index.");
        }
        catch (error) {
            if (error.code === 27) {
                console.log("Index email_1 does not exist, skipping.");
            }
            else {
                console.error("Error dropping index:", error);
            }
        }
        yield mongoose_1.default.disconnect();
    });
}
run().catch(console.error);
