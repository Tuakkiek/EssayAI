import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import User from "../models/User";

const seedAdmin = async () => {
  await connectDB();

  const email = "admin@gmail.com";
  const phone = "999";
  const existing = await User.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("✅ Admin đã tồn tại, bỏ qua.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await User.create({
    email,
    phone,
    passwordHash,
    name: "System Administrator",
    role: "admin",
    isActive: true,
    registrationMode: "system",
  });

  // eslint-disable-next-line no-console
  console.log("✅ Tạo admin thành công: admin@gmail.com / Admin@123");
  process.exit(0);
};

seedAdmin().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Seed thất bại:", err);
  process.exit(1);
});
