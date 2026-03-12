import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, Center } from "../models/index";
import { IUser, UserRole } from "../models/User";
import { AppError } from "../middlewares/errorHandler";
import { signToken, JwtPayload } from "../middlewares/auth";
import { logger } from "../utils/logger";

const SALT_ROUNDS = 12;

// ── Shared result shape ────────────────────────────────────────────
export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    role: UserRole;
    centerId: string | null;
    centerName?: string | null;
    mustChangePassword: boolean;
    avatarUrl: string | null;
  };
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: "free_student" | "teacher";
  centerName?: string;
}

export const registerUser = async (
  input: RegisterUserInput,
): Promise<AuthResult> => {
  const { name, email, password, role, centerName } = input;

  if (password.length < 6) {
    throw new AppError("M?t kh?u ph?i c� �t nh?t 6 k� t?", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError("Email d� du?c dang k�", 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let centerId: mongoose.Types.ObjectId | null = null;
  let resolvedCenterName: string | null = null;

  if (role === "teacher") {
    if (!centerName || !centerName.trim()) {
      throw new AppError("Gi�o vi�n ph?i nh?p t�n trung t�m/t? ch?c", 400);
    }

    const { slugify } = await import("../utils/textUtils");
    let slug = slugify(centerName);
    const slugExists = await Center.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const center = await Center.create({
      name: centerName.trim(),
      slug,
      contactEmail: email.toLowerCase(),
      ownerId: new mongoose.Types.ObjectId(), // temp placeholder, updated below
      subscription: { plan: "free", isActive: true },
      teachers: [],
      teacherCount: 0,
      studentCount: 0,
    });

    centerId = center._id as mongoose.Types.ObjectId;
    resolvedCenterName = center.name;

    const teacher = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role: "teacher",
      centerId,
      centerName: centerName.trim(),
      registrationMode: "self",
      mustChangePassword: false,
      isActive: true,
    });

    await Center.findByIdAndUpdate(center._id, {
      ownerId: teacher._id,
      teachers: [teacher._id],
      teacherCount: 1,
    });

    logger.info("Teacher registered", {
      userId: teacher._id,
      centerId: center._id,
    });

    return buildAuthResult(teacher, centerId?.toString(), resolvedCenterName);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
    role: "free_student",
    centerId: null,
    registrationMode: "self",
    mustChangePassword: false,
    isActive: true,
    selfSubscription: {
      plan: "individual_free",
      isActive: true,
    },
  });

  logger.info("Free student registered", { userId: user._id, email });
  return buildAuthResult(user, null, null);
};

// ── Login (all roles) ────────────────────────────────
export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user) throw new AppError("Invalid email or password", 401);
  if (!user.isActive)
    throw new AppError("Your account has been disabled. Contact admin.", 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  await User.findByIdAndUpdate(user._id, { "stats.lastActiveAt": new Date() });
  logger.info("User logged in", {
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  return buildAuthResult(user, user.centerId?.toString(), user.centerName ?? null);
};

// ── Get profile ───────────────────────────────────────────────────
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

// ── Change own password ───────────────────────────────────────────
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("User not found", 404);

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new AppError("Current password is incorrect", 401);

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.findByIdAndUpdate(userId, {
    passwordHash: newHash,
    mustChangePassword: false,
  });

  logger.info("Password changed", { userId });
};

// ── Helper ────────────────────────────────────────────────────────
const buildAuthResult = (
  user: IUser,
  centerId?: string | null,
  centerName?: string | null,
): AuthResult => {
  const payload: JwtPayload = {
    userId: (user._id as mongoose.Types.ObjectId).toString(),
    email: user.email ?? user.phone ?? "",
    role: user.role,
    centerId: centerId ?? undefined,
  };
  const token = signToken(payload);

  return {
    token,
    user: {
      id: payload.userId,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: user.role,
      centerId: centerId ?? null,
      centerName: centerName ?? user.centerName ?? null,
      mustChangePassword: user.mustChangePassword,
      avatarUrl: user.avatarUrl ?? null,
    },
  };
};

// Backwards-compatible alias (deprecated)
export const registerSelfStudent = async (input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResult> => {
  return registerUser({
    name: input.name,
    email: input.email,
    password: input.password,
    role: "free_student",
  });
};