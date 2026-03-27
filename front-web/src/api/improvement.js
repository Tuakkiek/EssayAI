import apiClient from "./client";

export const getProgress = () => apiClient.get("/api/improvement/progress");

export const rewriteEssay = (essayId) =>
  apiClient.post("/api/improvement/rewrite", { essayId });

export const enhanceVocabulary = (essayId) =>
  apiClient.post("/api/improvement/vocabulary", { essayId });

export const explainGrammar = (essayId) =>
  apiClient.post("/api/improvement/grammar", { essayId });
