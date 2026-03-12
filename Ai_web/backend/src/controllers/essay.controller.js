import { analyzeEssayContent } from '../services/ai_services.js';

export const processEssayGrading = async (req, res) => {
    try {
        const { essayContent } = req.body;
        
        if (!essayContent || typeof essayContent !== 'string') {
            return res.status(400).json({ error: 'Valid essay content is required.' });
        }

        const result = await analyzeEssayContent(essayContent);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error grading essay:', error);
        res.status(500).json({ 
            error: error.message || 'An error occurred while grading the essay.',
            status: error.status || 500
        });
    }
};
