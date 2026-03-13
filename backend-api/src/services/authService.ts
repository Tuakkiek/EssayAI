import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, Center } from "../models/index";
import { IUser, UserRole } from "../models/User";
import { AppError } from "../middlewares/errorHandler";
import { signToken, JwtPayload } from "../middlewares/auth";
import { logger } from "../utils/logger";
import { normalizePhone } from "../utils/textUtils";

const SALT_ROUNDS = 12;

// â”€â”€ Shared result shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: UserRole;
    centerId: string | null;
    centerName?: string | null;
    mustChangePassword: boolean;
    avatarUrl: string | null;
  };
}

export interface RegisterUserInput {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  role: "free_student" | "teacher";
  centerName?: string;
}

export const registerUser = async (
  input: RegisterUserInput,
): Promise<AuthResult> => {
  const { name, phone: rawPhone, email, password, role, centerName } = input;

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    throw new AppError("Phone is required", 400);
  }

  if (password.length < 6) {
    throw new AppError("M?t kh?u ph?i có ít nh?t 6 ký t?", 400);
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new AppError("Phone already registered", 409);

  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  if (normalizedEmail) {
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let centerId: mongoose.Types.ObjectId | null = null;
  let resolvedCenterName: string | null = null;

  if (role === "teacher") {
    if (!centerName || !centerName.trim()) {
      throw new AppError("Giáo viên ph?i nh?p tên trung tâm/t? ch?c", 400);
    }

    const { slugify } = await import("../utils/textUtils");
    let slug = slugify(centerName);
    const slugExists = await Center.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const center = await Center.create({
      name: centerName.trim(),
      slug,
      contactEmail: normalizedEmail,
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
      phone,
      email: normalizedEmail,
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

    return buildAuthResult(teacher, teacher.centerId?.toString(), resolvedCenterName);
  }

  const user = await User.create({
    name: name.trim(),
    phone,
    email: normalizedEmail,
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

  logger.info("Free student registered", { userId: user._id, phone });
  return buildAuthResult(user, null, null);
};

// â”€â”€ Login (all roles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const login = async (rawPhone: string, password: string): Promise<AuthResult> => {
  const phone = normalizePhone(rawPhone);
  const user = await User.findOne({ phone }).select(
    "+passwordHash",
  );
  if (!user) throw new AppError("Invalid phone or password", 401);
  if (!user.isActive)
    throw new AppError("Your account has been disabled. Contact admin.", 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid phone or password", 401);

  await User.findByIdAndUpdate(user._id, { "stats.lastActiveAt": new Date() });
  logger.info("User logged in", {
    userId: user._id,
    phone: user.phone,
    role: user.role,
  });

  return buildAuthResult(user, user.centerId?.toString(), user.centerName ?? null);
};

// â”€â”€ Get profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

// â”€â”€ Change own password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildAuthResult = (
  user: IUser,
  centerId?: string | null,
  centerName?: string | null,
): AuthResult => {
  const payload: JwtPayload = {
    userId: (user._id as mongoose.Types.ObjectId).toString(),
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    ...(centerId ? { centerId } : {}),
  };
  const token = signToken(payload);

  return {
    token,
    user: {
      id: payload.userId,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone,
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
  phone: string;
  email?: string;
  password: string;
}): Promise<AuthResult> => {
  return registerUser({
    name: input.name,
    phone: input.phone,
    email: input.email,
    password: input.password,
    role: "free_student",
  });
};
