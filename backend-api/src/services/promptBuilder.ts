import { EssayTaskType } from "../models/index"

export interface PromptInput {
  essayText: string
  prompt: string
  taskType: EssayTaskType
  wordCount: number
}

// ── IELTS Band descriptors for context ──────────────────────────────
const BAND_GUIDE = `
IELTS Band Score Guide:
- 9: Expert — fully operational command, appropriate, accurate
- 8: Very Good — fully operational with occasional inaccuracies
- 7: Good — operational command, some inaccuracies in complex situations
- 6: Competent — effective command despite some inaccuracies
- 5: Modest — partial command, many mistakes
- 4: Limited — basic competence, frequent problems
- 3: Extremely Limited — conveys general meaning in familiar situations
`.trim()

// ── Task-specific instructions ────────────────────────────────────
const TASK_INSTRUCTIONS: Record<EssayTaskType, string> = {
  task1: `This is an IELTS Writing Task 1 (describing a graph, chart, or diagram).
Evaluate: task achievement, coherence & cohesion, lexical resource, grammatical range & accuracy.
Minimum expected word count: 150 words.`,
  task2: `This is an IELTS Writing Task 2 (academic essay / argument).
Evaluate: task response, coherence & cohesion, lexical resource, grammatical range & accuracy.
Minimum expected word count: 250 words.`,
}

// ── Main prompt builder ──────────────────────────────────────────
export const buildScoringPrompt = (input: PromptInput): string => {
  const taskInstruction = TASK_INSTRUCTIONS[input.taskType]

  return `Hãy đóng vai một giám khảo IELTS Writing cực kỳ khắt khe và có thâm niên. Nhiệm vụ của bạn là chấm điểm bài Essay sau đây dựa trên 4 tiêu chí: Task Response (hoặc Task Achievement đối với Task 1), Coherence and Cohesion, Lexical Resource, và Grammatical Range Accuracy.

Quy tắc chấm điểm và phản hồi:
- Thái độ: Nghiêm túc, thẳng thắn, không dùng những lời khen sáo rỗng. Nếu bài viết tệ, hãy nói thẳng là tệ. Nếu ý tưởng ngây ngô, hãy chỉ trích sự thiếu logic.
- Khen/Chê: Chỉ khen những điểm thực sự xuất sắc. Tập trung 80% vào việc "nhặt lỗi" (sai ngữ pháp, dùng từ sai ngữ cảnh, lập luận yếu, lặp từ).
- Điểm số: Chấm điểm cực kỳ sát sao (thậm chí là "chặt tay"). Không ngại cho điểm 3.0 hoặc 4.0 nếu bài viết không đạt yêu cầu.
- Sửa lỗi: Phải liệt kê các lỗi sai cụ thể và cung cấp phương án sửa đổi chuyên nghiệp hơn.

${BAND_GUIDE}

${taskInstruction}

ĐỀ BÀI (ESSAY PROMPT):
"${input.prompt}"

BÀI VIẾT CỦA HỌC VIÊN (${input.wordCount} từ):
"""
${input.essayText}
"""

Analyze this essay thoroughly and respond with ONLY a valid JSON object. No extra text, no markdown, no explanation outside the JSON.
IMPORTANT: All explanations, suggestions, and feedback (aiFeedback, explanation, text) MUST be written in Vietnamese, applying the strict, straightforward, and "salt-rubbing" examiner persona requested.

JSON Format Requirements:
{
  "score": <overall band 0-9, use 0.5 increments like 5.5, 6.0, 6.5>,
  "scoreBreakdown": {
    "taskAchievement": <0-9>,
    "coherenceCohesion": <0-9>,
    "lexicalResource": <0-9>,
    "grammaticalRange": <0-9>
  },
  "grammarErrors": [
    {
      "original": "<exact phrase/sentence from essay that is wrong>",
      "corrected": "<professional corrected version>",
      "explanation": "<Phân tích chi tiết lỗi: giải thích thẳng thắn tại sao sai>"
    }
  ],
  "suggestions": [
    {
      "category": "<one of: vocabulary|structure|coherence|argument|general>",
      "text": "<Lời khuyên 'xát muối': Những điều tối kỵ trong bài mà người viết đã mắc phải và cách khắc phục>"
    }
  ],
  "aiFeedback": "<Nhận xét tổng quát: Đánh giá nghiêm túc về tư duy và độ hoàn thiện. Phê bình thẳng thắn, không khen ngợi sáo rỗng.>"
}`
}

// ── System prompt ────────────────────────────────────────────────
export const SYSTEM_PROMPT = `Bạn là một giám khảo IELTS Writing cực kỳ khắt khe và có thâm niên. Bạn luôn luôn trả về một valid JSON object duy nhất. Bạn KHÔNG BAO GIỜ bao gồm markdown code blocks, văn bản mào đầu, hay bất kỳ nội dung nào nằm ngoài JSON object. Điểm số của bạn phải trung thực, cực kỳ sát sao ('chặt tay'), theo đúng tiêu chuẩn IELTS official, tuyệt đối không chấm nương tay hay cho điểm ảo.`
