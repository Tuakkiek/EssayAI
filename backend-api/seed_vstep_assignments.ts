/**
 * seed_vstep_assignments.ts
 *
 * Tự động tạo 10 bài tập Essay cho lớp VSTEP-01-03-26
 * Tiêu chí chấm điểm theo thang điểm VSTEP Writing Task 2 (chuẩn ĐGNLNN Việt Nam)
 *
 * Chạy:  npx ts-node -r dotenv/config seed_vstep_assignments.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import { Class, User, Assignment } from "./src/models/index";

// ──────────────────────────────────────────────────────────────────────────────
// VSTEP Writing Task 2 — Tiêu chí chấm điểm chuẩn
// Theo: Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (Ban hành kèm TT 01/2014/TT-BGDĐT)
// và đề thi minh họa VSTEP của ĐHQGHN
// Thang: 0 – 10 điểm cho mỗi tiêu chí; điểm Writing = trung bình cộng 4 tiêu chí
// ──────────────────────────────────────────────────────────────────────────────
const VSTEP_OVERVIEW = `
Bài viết được chấm theo 4 tiêu chí chuẩn VSTEP Writing Task 2 (mỗi tiêu chí 0-10 điểm):

1. Task Response (Nội dung & Giải quyết đề bài – 25%)
   Người viết phải trả lời đầy đủ tất cả các phần của đề, trình bày quan điểm rõ ràng, có lập luận tốt, dẫn chứng phù hợp.

2. Coherence & Cohesion (Tính mạch lạc & Liên kết – 25%)
   Bài viết có cấu trúc logic, sử dụng các phương tiện liên kết (discourse markers, pronouns, synonyms) hợp lý và đa dạng. Mỗi đoạn văn có chủ đề rõ ràng.

3. Lexical Resource (Vốn từ vựng – 25%)
   Sử dụng từ vựng phong phú, chính xác, phù hợp văn phong học thuật. Tránh lặp từ. Sử dụng collocations và idiomatic expressions phù hợp.

4. Grammatical Range & Accuracy (Ngữ pháp – 25%)
   Sử dụng đa dạng cấu trúc câu (đơn, phức, ghép). Lỗi ngữ pháp ít và không ảnh hưởng đến nghĩa.

Độ dài tối thiểu: 250 từ. Bài dưới 250 từ bị trừ điểm tương ứng.
`.trim();

const VSTEP_BAND_DESCRIPTORS = [
  { band: 9, descriptor: "Xuất sắc: Tất cả 4 tiêu chí ở mức cao nhất. Bài viết hoàn chỉnh, không có lỗi đáng kể, lập luận sắc bén, từ vựng & ngữ pháp phong phú chính xác." },
  { band: 8, descriptor: "Giỏi: Hoàn thành tốt tất cả tiêu chí. Có thể mắc một vài lỗi nhỏ không ảnh hưởng đến sự trôi chảy. Từ vựng đa dạng, cấu trúc câu linh hoạt." },
  { band: 7, descriptor: "Khá: Đáp ứng tốt yêu cầu đề bài, thi thoảng có lỗi nhỏ. Từ vựng và ngữ pháp đủ đa dạng. Cấu trúc bài rõ ràng." },
  { band: 6, descriptor: "Trung bình khá: Giải quyết được đề bài nhưng chưa đầy đủ hoặc thiếu chiều sâu. Có lỗi ngữ pháp/từ vựng nhưng không làm mất nghĩa chính." },
  { band: 5, descriptor: "Trung bình: Đáp ứng một phần yêu cầu. Lập luận còn hạn chế, từ vựng đơn giản, có lỗi ngữ pháp ảnh hưởng đến nghĩa." },
  { band: 4, descriptor: "Dưới trung bình: Chỉ đáp ứng một phần nhỏ yêu cầu. Nhiều lỗi ngữ pháp và từ vựng, bài viết thiếu mạch lạc." },
  { band: 3, descriptor: "Yếu: Hiểu sai hoặc chỉ trả lời được một phần rất nhỏ của đề. Rất nhiều lỗi, gặp khó khăn khi đọc hiểu bài viết." },
  { band: 2, descriptor: "Kém: Gần như không giải quyết được yêu cầu đề bài. Bài viết rất ngắn hoặc không liên quan." },
  { band: 1, descriptor: "Rất kém: Không liên quan đến đề bài, sao chép đề hoặc viết bằng tiếng Việt." },
  { band: 0, descriptor: "Không chấm được: Không nộp bài, bỏ trống hoặc nội dung hoàn toàn không phù hợp." },
];

const VSTEP_STRUCTURE = `
Cấu trúc bài viết VSTEP Task 2 chuẩn (tối thiểu 250 từ):
• Introduction (1 đoạn): Dẫn dắt chủ đề, nêu rõ luận điểm chính (thesis statement)
• Body Paragraph 1 (1 đoạn): Luận điểm 1 + dẫn chứng/ví dụ
• Body Paragraph 2 (1 đoạn): Luận điểm 2 + dẫn chứng/ví dụ
• (Tùy chọn) Body Paragraph 3: Luận điểm phản bác hoặc luận điểm 3 nếu là Discuss both views
• Conclusion (1 đoạn): Tóm tắt và khẳng định lại quan điểm
`.trim();

const VSTEP_PENALTY = `
Quy định trừ điểm:
- Bài dưới 250 từ: trừ điểm tương ứng theo tỷ lệ thiếu
- Viết hoàn toàn bằng tiếng Việt: 0 điểm
- Sao chép nguyên văn đề bài: 0 điểm
- Đạo văn (plagiarism): 0 điểm
`.trim();

// ──────────────────────────────────────────────────────────────────────────────
// Dữ liệu 10 bài tập
// ──────────────────────────────────────────────────────────────────────────────
interface AssignmentData {
  title: string;
  description: string;
  prompt: string;
  requiredVocabulary: { word: string; synonyms?: string[]; importance: "required" | "recommended" }[];
  additionalNotes: string;
}

const assignments: AssignmentData[] = [
  // 1. Công nghệ & Giáo dục
  {
    title: "Essay 1: Technology & Children's Development (Jan 2026)",
    description: "Chủ đề: Công nghệ & Giáo dục – Ảnh hưởng của máy tính đến trẻ em.",
    prompt:
      "In recent years, many parents have let their children use computers from early ages. Some people say that it is good for children. However, some others hold the view that it has negative effects. Discuss both views and give your opinion.",
    requiredVocabulary: [
      { word: "cognitive development", synonyms: ["intellectual growth"], importance: "required" },
      { word: "screen time", synonyms: ["time spent on devices"], importance: "required" },
      { word: "digital literacy", synonyms: ["technological skills"], importance: "required" },
      { word: "detrimental", synonyms: ["harmful", "damaging"], importance: "recommended" },
      { word: "beneficial", synonyms: ["advantageous", "positive"], importance: "recommended" },
      { word: "supervision", synonyms: ["parental guidance", "monitoring"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Discuss both views + opinion. Thí sinh phải trình bày CẢ HAI quan điểm (tốt và xấu) rồi đưa ra ý kiến cá nhân có lý lẽ. Không được chỉ viết một chiều.",
  },

  // 2. Công việc & Sự nghiệp
  {
    title: "Essay 2: High Salary vs Job Satisfaction",
    description: "Chủ đề: Công việc & Sự nghiệp – Lương cao hay sự hài lòng trong công việc?",
    prompt:
      "Many people believe that having a high salary is more important than job satisfaction. To what extent do you agree or disagree with this statement?",
    requiredVocabulary: [
      { word: "financial security", synonyms: ["economic stability", "monetary stability"], importance: "required" },
      { word: "job satisfaction", synonyms: ["work fulfillment", "occupational contentment"], importance: "required" },
      { word: "intrinsic motivation", synonyms: ["internal drive"], importance: "required" },
      { word: "work-life balance", synonyms: ["equilibrium between work and personal life"], importance: "recommended" },
      { word: "burnout", synonyms: ["exhaustion", "mental fatigue"], importance: "recommended" },
      { word: "productivity", synonyms: ["efficiency", "output"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Opinion essay (Agree/Disagree). Thí sinh nêu rõ mức độ đồng ý/không đồng ý và lập luận nhất quán trong toàn bài. Được phép đồng ý một phần (partially agree).",
  },

  // 3. Môi trường & Năng lượng
  {
    title: "Essay 3: Renewable & Nuclear Energy – Environmental Impacts",
    description: "Chủ đề: Môi trường & Năng lượng – Tác động của các dạng năng lượng mới.",
    prompt:
      "The development of energy (solar, wind, nuclear) has both positive and negative impacts on the environment. Write an essay to discuss these impacts.",
    requiredVocabulary: [
      { word: "renewable energy", synonyms: ["sustainable energy", "clean energy"], importance: "required" },
      { word: "carbon emissions", synonyms: ["greenhouse gas", "CO2 output"], importance: "required" },
      { word: "nuclear waste", synonyms: ["radioactive waste", "nuclear byproduct"], importance: "required" },
      { word: "ecosystem", synonyms: ["natural habitat", "environment"], importance: "recommended" },
      { word: "fossil fuels", synonyms: ["coal, oil and gas", "non-renewable resources"], importance: "recommended" },
      { word: "sustainability", synonyms: ["long-term viability", "environmental responsibility"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Discussion essay (cả hai mặt tích cực và tiêu cực). Thí sinh cần đề cập đến ít nhất 2 trong số 3 loại năng lượng được nêu trong đề (mặt trời, gió, hạt nhân).",
  },

  // 4. Đô thị hóa & Di cư
  {
    title: "Essay 4: Urban-to-Rural Migration – Advantages & Disadvantages",
    description: "Chủ đề: Đô thị hóa & Di cư – Xu hướng chuyển từ thành thị về nông thôn.",
    prompt:
      "Nowadays, more and more people are moving from urban areas to rural areas to live. What are the advantages and disadvantages of this trend?",
    requiredVocabulary: [
      { word: "urbanization", synonyms: ["urban growth", "city expansion"], importance: "required" },
      { word: "rural lifestyle", synonyms: ["countryside living", "village life"], importance: "required" },
      { word: "cost of living", synonyms: ["living expenses", "cost of daily life"], importance: "required" },
      { word: "infrastructure", synonyms: ["public facilities", "basic services"], importance: "recommended" },
      { word: "quality of life", synonyms: ["standard of living", "well-being"], importance: "recommended" },
      { word: "community", synonyms: ["local society", "neighborhood"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Advantages & Disadvantages. Thí sinh phải trình bày RÕ RÀNG cả ưu điểm lẫn nhược điểm. Độ dài 2 mặt cần tương đối cân bằng.",
  },

  // 5. Kỹ năng ngôn ngữ
  {
    title: "Essay 5: Reading & Writing Skills in the Modern Age (Nov 2025)",
    description: "Chủ đề: Kỹ năng ngôn ngữ – Tầm quan trọng của đọc và viết ngày nay.",
    prompt:
      "Some people believe that reading and writing skills are more important today than ever before. To what extent do you agree or disagree?",
    requiredVocabulary: [
      { word: "literacy", synonyms: ["reading and writing ability", "language proficiency"], importance: "required" },
      { word: "digital communication", synonyms: ["online communication", "virtual messaging"], importance: "required" },
      { word: "critical thinking", synonyms: ["analytical thinking", "reasoning ability"], importance: "required" },
      { word: "information overload", synonyms: ["excess information", "data overload"], importance: "recommended" },
      { word: "academic performance", synonyms: ["scholarly achievement", "educational outcome"], importance: "recommended" },
      { word: "multimedia", synonyms: ["audio-visual content", "digital media"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Opinion essay. Thí sinh cần liên hệ đến bối cảnh kỹ thuật số hiện đại (mạng xã hội, email, báo cáo công việc…) để làm nổi bật tầm quan trọng của kỹ năng đọc-viết.",
  },

  // 6. Việc làm của Sinh viên
  {
    title: "Essay 6: Part-time Jobs for University Students",
    description: "Chủ đề: Việc làm của Sinh viên – Làm thêm khi đang học đại học.",
    prompt:
      "Many university students take part-time jobs while studying. Does this trend have more advantages or disadvantages for their academic performance?",
    requiredVocabulary: [
      { word: "academic performance", synonyms: ["study results", "scholastic achievement"], importance: "required" },
      { word: "time management", synonyms: ["scheduling", "prioritization"], importance: "required" },
      { word: "financial independence", synonyms: ["economic self-sufficiency", "self-reliance"], importance: "required" },
      { word: "stress", synonyms: ["pressure", "workload"], importance: "recommended" },
      { word: "practical experience", synonyms: ["real-world skills", "hands-on experience"], importance: "recommended" },
      { word: "concentration", synonyms: ["focus", "attention"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: More advantages or disadvantages? Thí sinh nên chọn một lập trường rõ ràng (nghiêng về advantages HOẶC disadvantages) và lập luận nhất quán. Câu kết luận phải trả lời trực tiếp câu hỏi.",
  },

  // 7. Sức khỏe & Lối sống
  {
    title: "Essay 7: Government Ban on Smoking in Public Places",
    description: "Chủ đề: Sức khỏe & Lối sống – Lệnh cấm hút thuốc nơi công cộng.",
    prompt:
      "Some people think that the government should ban smoking in all public places. Do you agree or disagree with this opinion?",
    requiredVocabulary: [
      { word: "passive smoking", synonyms: ["second-hand smoke", "involuntary smoking"], importance: "required" },
      { word: "public health", synonyms: ["community health", "population health"], importance: "required" },
      { word: "individual freedom", synonyms: ["personal rights", "civil liberties"], importance: "required" },
      { word: "legislation", synonyms: ["law", "regulation"], importance: "recommended" },
      { word: "addiction", synonyms: ["dependence", "habit"], importance: "recommended" },
      { word: "respiratory illness", synonyms: ["lung disease", "breathing disorder"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Agree/Disagree. Lưu ý: Đây là đề có tính tranh luận cao. Thí sinh cần lập luận có chiều sâu, không chỉ nêu quan điểm đơn giản. Được phép đề cập quan điểm đối lập để phản bác (counter-argument).",
  },

  // 8. Mạng xã hội
  {
    title: "Essay 8: Social Media and Human Relationships",
    description: "Chủ đề: Mạng xã hội & Mối quan hệ – Mạng xã hội thay đổi cách giao tiếp của con người.",
    prompt:
      "Social media has changed the way people communicate and build relationships. Is this a positive or negative development?",
    requiredVocabulary: [
      { word: "social media", synonyms: ["online platforms", "social networks"], importance: "required" },
      { word: "interpersonal relationships", synonyms: ["human connections", "social bonds"], importance: "required" },
      { word: "virtual communication", synonyms: ["online interaction", "digital communication"], importance: "required" },
      { word: "cyberbullying", synonyms: ["online harassment", "digital abuse"], importance: "recommended" },
      { word: "connectivity", synonyms: ["connection", "networking"], importance: "recommended" },
      { word: "misinformation", synonyms: ["fake news", "false information"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Positive or Negative development? Thí sinh chọn quan điểm rõ ràng. Cần đề cập đến sự thay đổi cụ thể trong giao tiếp (không chỉ nói chung chung), ví dụ: Facebook, Zalo, Instagram.",
  },

  // 9. Du lịch & Văn hóa
  {
    title: "Essay 9: Tourism – Economic Benefits vs Environmental & Cultural Costs",
    description: "Chủ đề: Du lịch & Văn hóa – Lợi ích kinh tế và tác hại của du lịch.",
    prompt:
      "Some people believe that tourism is beneficial because it brings income and jobs. Others argue that it causes environmental damage and cultural loss. Discuss both views.",
    requiredVocabulary: [
      { word: "tourism industry", synonyms: ["travel sector", "hospitality industry"], importance: "required" },
      { word: "cultural heritage", synonyms: ["cultural identity", "traditional values"], importance: "required" },
      { word: "economic growth", synonyms: ["financial development", "prosperity"], importance: "required" },
      { word: "environmental degradation", synonyms: ["ecological damage", "habitat destruction"], importance: "required" },
      { word: "sustainable tourism", synonyms: ["eco-tourism", "responsible travel"], importance: "recommended" },
      { word: "commercialization", synonyms: ["commodification", "over-exploitation"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Discuss both views. Thí sinh HỌ phải trình bày CẢ HAI phía (lợi ích kinh tế VÀ tác hại môi trường/văn hóa). Bài có thể có hoặc không có phần ý kiến cá nhân ở cuối.",
  },

  // 10. Giáo dục cộng đồng
  {
    title: "Essay 10: Unpaid Community Service for Young People",
    description: "Chủ đề: Giáo dục cộng đồng – Khuyến khích giới trẻ tham gia tình nguyện.",
    prompt:
      "Young people should be encouraged to participate in unpaid community service. What are the benefits of this for the individuals and the society?",
    requiredVocabulary: [
      { word: "community service", synonyms: ["voluntary work", "civic engagement"], importance: "required" },
      { word: "social responsibility", synonyms: ["civic duty", "community obligation"], importance: "required" },
      { word: "empathy", synonyms: ["compassion", "understanding others"], importance: "required" },
      { word: "skill development", synonyms: ["personal growth", "capability building"], importance: "recommended" },
      { word: "social cohesion", synonyms: ["community solidarity", "social unity"], importance: "recommended" },
      { word: "volunteer", synonyms: ["unpaid worker", "community helper"], importance: "recommended" },
    ],
    additionalNotes:
      "Dạng bài: Benefits essay (chỉ bàn về lợi ích – không yêu cầu cả hai chiều). Thí sinh phải bàn về lợi ích cho CẢ HAI đối tượng: cá nhân (individual) VÀ xã hội (society). Bỏ qua một trong hai bị trừ điểm Task Response.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main runner
// ──────────────────────────────────────────────────────────────────────────────
const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌  MONGODB_URI not found in .env");
    process.exit(1);
  }

  console.log("🔗  Connecting to MongoDB…");
  await mongoose.connect(mongoUri);
  console.log("✅  Connected.\n");

  // 1. Tìm lớp VSTEP-01-03-26
  const cls = await Class.findOne({ name: { $regex: /^VSTEP-01-03-26$/i } });
  if (!cls) {
    console.error('❌  Không tìm thấy lớp "VSTEP-01-03-26". Hãy tạo lớp trước rồi chạy lại script này.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`📚  Tìm thấy lớp: ${cls.name} (ID: ${cls._id})`);
  console.log(`👨‍🏫  Teacher ID: ${cls.teacherId}`);
  console.log(`🏢  Center ID: ${cls.centerId}\n`);

  // 2. Thời gian: bắt đầu ngay hôm nay, hạn nộp sau 14 ngày
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);

  // 3. Tạo từng bài tập
  let created = 0;
  let failed = 0;

  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    try {
      const assignment = await Assignment.create({
        centerId: cls.centerId,
        classId: cls._id,
        teacherId: cls.teacherId,
        title: a.title,
        description: a.description,
        taskType: "task2",
        prompt: a.prompt,
        status: "published",
        startDate: now,
        dueDate: dueDate,
        maxAttempts: 3,
        gradingCriteria: {
          overview: VSTEP_OVERVIEW,
          requiredVocabulary: a.requiredVocabulary,
          bandDescriptors: VSTEP_BAND_DESCRIPTORS,
          structureRequirements: VSTEP_STRUCTURE,
          penaltyNotes: VSTEP_PENALTY,
          additionalNotes: a.additionalNotes,
        },
      });
      created++;
      console.log(`  ✅  [${i + 1}/10] Đã tạo: "${a.title}" — ID: ${assignment._id}`);
    } catch (err: any) {
      failed++;
      console.error(`  ❌  [${i + 1}/10] Lỗi tạo "${a.title}": ${err.message}`);
    }
  }

  // 4. Kết quả
  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅  Thành công: ${created}/10 bài tập`);
  if (failed > 0) console.log(`❌  Thất bại:   ${failed}/10 bài tập`);
  console.log(`${"─".repeat(60)}\n`);

  await mongoose.disconnect();
  console.log("🔌  Đã ngắt kết nối MongoDB.");
};

run().catch((err) => {
  console.error("❌  Lỗi không mong đợi:", err);
  process.exit(1);
});
