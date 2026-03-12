import { User } from "../models/index";
import { AppError } from "../middlewares/errorHandler";

// ── Individual subscription management ──────────────────────────────
export const getIndividualSubscription = async (userId: string) => {
  const user = await User.findById(userId).select(
    "individualSubscription accountType",
  );

  if (user?.accountType !== "INDIVIDUAL_USER") {
    throw new AppError("Individual account required", 403);
  }

  return user.individualSubscription;
};

export const upgradeSubscription = async (
  userId: string,
  plan: "individual_pro" | "individual_premium",
) => {
  const user = await User.findById(userId);

  if (!user || user.accountType !== "INDIVIDUAL_USER") {
    throw new AppError("Individual account required", 403);
  }

  user.individualSubscription = {
    ...user.individualSubscription,
    plan,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
  };

  await user.save();
  return user.individualSubscription;
};
