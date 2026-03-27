import apiClient from "./client";

export const getPlans = () => apiClient.get("/api/subscription/plans");

export const getStatus = () => apiClient.get("/api/subscription");

export const checkout = (planId) =>
  apiClient.post("/api/subscription/checkout", { plan: planId });
