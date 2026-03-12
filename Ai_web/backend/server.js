import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import essayRoutes from './src/routes/essay.routes.js';

dotenv.config();
console.log('--- SERVER STARTING ---');
console.log('ENV PORT:', process.env.PORT);
console.log('ENV GEMINI_API_KEY EXISTS:', !!process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Versioning API để dễ mở rộng sau này (v1, v2...)
app.use('/api/v1/essays', essayRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});