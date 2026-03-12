/**
 * bulkImportService.ts  (Phase 2)
 *
 * Accepts a CSV or Excel (.xlsx) buffer, validates every row, then
 * creates student accounts in a single batched operation.
 *
 * CSV format (with header row):
 *   name, phone, className
 *
 * Rules:
 *  - Duplicate phones within the upload → marked as error, skipped
 *  - Phone already exists in center    → marked as error, skipped
 *  - Unknown className                 → warning, student created without class
 *  - All valid rows are processed regardless of errors in other rows
 *
 * Returns:
 *  - created[]   — succeeded rows with plainPassword (shown ONCE)
 *  - errors[]    — failed rows with reason
 *  - warnings[]  — rows processed but with non-fatal issues
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { User, Class } from "../models/index";
import {
  generateStudentCredentials,
  normalizePhone,
  validatePhone,
  removeAccents,
} from "../utils/textUtils";

const SALT_ROUNDS = 12;
const MAX_ROWS = 500;

// ── Types ─────────────────────────────────────────────────────────────

export interface BulkImportRow {
  rowNumber: number;
  name: string;
  phone: string;
  className: string;
}

export interface BulkCreatedStudent {
  rowNumber: number;
  name: string;
  phone: string;
  className: string;
  studentId: string;
  plainPassword: string;
}

export interface BulkError {
  rowNumber: number;
  name: string;
  phone: string;
  reason: string;
}

export interface BulkWarning {
  rowNumber: number;
  name: string;
  phone: string;
  reason: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  created: BulkCreatedStudent[];
  errors: BulkError[];
  warnings: BulkWarning[];
}

// ── Parse buffer → rows ───────────────────────────────────────────────

export const parseBuffer = (
  buffer: Buffer,
  mimeType: string,
): BulkImportRow[] => {
  let rawRows: Record<string, string>[];

  const isExcel =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/octet-stream";

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
      raw: false,
    });
  } else {
    // CSV (UTF-8 or Windows-1252 — csv-parse handles BOM automatically)
    rawRows = csvParse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // strip UTF-8 BOM if present
    }) as Record<string, string>[];
  }

  return rawRows.map((row, i) => ({
    rowNumber: i + 2, // +2 because row 1 is the header
    name: (
      row["name"] ??
      row["Name"] ??
      row["họ tên"] ??
      row["Họ Tên"] ??
      ""
    ).trim(),
    phone: (
      row["phone"] ??
      row["Phone"] ??
      row["số điện thoại"] ??
      row["SĐT"] ??
      ""
    ).trim(),
    className: (
      row["className"] ??
      row["class"] ??
      row["Class"] ??
      row["lớp"] ??
      row["Lớp"] ??
      ""
    ).trim(),
  }));
};

// ── Main import function ──────────────────────────────────────────────

export const bulkImportStudents = async (
  buffer: Buffer,
  mimeType: string,
  centerId: string,
  createdBy: string,
): Promise<BulkImportResult> => {
  // 1. Parse
  const rows = parseBuffer(buffer, mimeType);

  if (rows.length === 0) {
    throw new Error("The uploaded file contains no data rows");
  }
  if (rows.length > MAX_ROWS) {
    throw new Error(`File exceeds maximum of ${MAX_ROWS} rows per import`);
  }

  const errors: BulkError[] = [];
  const warnings: BulkWarning[] = [];
  const created: BulkCreatedStudent[] = [];

  const centerObjectId = new mongoose.Types.ObjectId(centerId);

  // 2. Normalize & validate all phones first (cheap, no DB)
  const normalizedRows = rows.map((row) => ({
    ...row,
    phone: normalizePhone(row.phone),
  }));

  // 3. Detect duplicates within the file
  const phoneSeen = new Map<string, number>(); // phone → first rowNumber
  for (const row of normalizedRows) {
    if (!row.name) {
      errors.push({
        rowNumber: row.rowNumber,
        name: row.name,
        phone: row.phone,
        reason: "Name is required",
      });
      continue;
    }
    if (!row.phone || !validatePhone(row.phone)) {
      errors.push({
        rowNumber: row.rowNumber,
        name: row.name,
        phone: row.phone,
        reason: `Invalid phone number: "${row.phone}"`,
      });
      continue;
    }
    if (phoneSeen.has(row.phone)) {
      errors.push({
        rowNumber: row.rowNumber,
        name: row.name,
        phone: row.phone,
        reason: `Duplicate phone — first seen at row ${phoneSeen.get(row.phone)}`,
      });
      continue;
    }
    phoneSeen.set(row.phone, row.rowNumber);
  }

  // Phones that survived file-level dedup
  const validPhones = [...phoneSeen.keys()];

  // 4. Check which phones already exist in this center (single DB query)
  const existingUsers = await User.find({
    phone: { $in: validPhones },
    centerId: centerObjectId,
  }).select("phone");
  const existingPhoneSet = new Set(existingUsers.map((u) => u.phone));

  // 5. Resolve classNames → class documents (single DB query)
  const uniqueClassNames = [
    ...new Set(
      normalizedRows
        .map((r) => r.className)
        .filter(Boolean)
        .map((n) => n.trim()),
    ),
  ];
  const classes = await Class.find({
    centerId: centerObjectId,
    name: { $in: uniqueClassNames },
    isActive: true,
  }).select("name _id");

  // Normalised name → ObjectId for O(1) lookup
  const classMap = new Map<string, mongoose.Types.ObjectId>(
    classes.map((c) => [
      c.name.trim().toLowerCase(),
      c._id as mongoose.Types.ObjectId,
    ]),
  );

  // 6. Process each row
  const toCreate: {
    row: (typeof normalizedRows)[number];
    classId: mongoose.Types.ObjectId | null;
    plainPassword: string;
    passwordHash: string;
  }[] = [];

  // We need error rows in a fast set for skip check
  const errorRowNumbers = new Set(errors.map((e) => e.rowNumber));

  for (const row of normalizedRows) {
    if (errorRowNumbers.has(row.rowNumber)) continue; // already recorded

    // Already exists in center?
    if (existingPhoneSet.has(row.phone)) {
      errors.push({
        rowNumber: row.rowNumber,
        name: row.name,
        phone: row.phone,
        reason: "Phone number already registered in this center",
      });
      continue;
    }

    // Resolve class
    let classId: mongoose.Types.ObjectId | null = null;
    if (row.className) {
      const key = row.className.trim().toLowerCase();
      classId = classMap.get(key) ?? null;
      if (!classId) {
        // Non-fatal — create student without a class
        warnings.push({
          rowNumber: row.rowNumber,
          name: row.name,
          phone: row.phone,
          reason: `Class "${row.className}" not found — student created without class`,
        });
      }
    }

    // Generate credentials (sync — no DB)
    const { password: plainPassword } = generateStudentCredentials(
      row.name,
      row.phone,
    );
    // Hash later in batch
    toCreate.push({ row, classId, plainPassword, passwordHash: "" });
  }

  // 7. Bcrypt all passwords in parallel (limited concurrency to avoid CPU spike)
  const CONCURRENCY = 10;
  for (let i = 0; i < toCreate.length; i += CONCURRENCY) {
    const chunk = toCreate.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        item.passwordHash = await bcrypt.hash(item.plainPassword, SALT_ROUNDS);
      }),
    );
  }

  // 8. Bulk insert valid students
  if (toCreate.length > 0) {
    const docs = toCreate.map((item) => ({
      name: item.row.name.trim(),
      phone: item.row.phone,
      passwordHash: item.passwordHash,
      role: "center_student" as const,
      centerId: centerObjectId,
      classIds: item.classId ? [item.classId] : [],
      isActive: true,
      mustChangePassword: true,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      stats: { essaysSubmitted: 0, averageScore: 0 },
    }));

    const inserted = await User.insertMany(docs, { ordered: false });

    // 9. Update Class.studentIds for all enrolled students
    const classStudentMap = new Map<string, mongoose.Types.ObjectId[]>();
    inserted.forEach((student, idx) => {
      const classId = toCreate[idx].classId;
      if (classId) {
        const key = classId.toString();
        if (!classStudentMap.has(key)) classStudentMap.set(key, []);
        classStudentMap.get(key)!.push(student._id as mongoose.Types.ObjectId);
      }
    });

    await Promise.all(
      [...classStudentMap.entries()].map(([classId, studentIds]) =>
        Class.findByIdAndUpdate(classId, {
          $addToSet: { studentIds: { $each: studentIds } },
        }),
      ),
    );

    // 10. Build result
    inserted.forEach((student, idx) => {
      const item = toCreate[idx];
      created.push({
        rowNumber: item.row.rowNumber,
        name: student.name,
        phone: student.phone ?? "",
        className: item.row.className,
        studentId: (student._id as mongoose.Types.ObjectId).toString(),
        plainPassword: item.plainPassword,
      });
    });
  }

  return {
    totalRows: rows.length,
    successCount: created.length,
    errorCount: errors.length,
    created,
    errors,
    warnings,
  };
};

// ── CSV template generator ────────────────────────────────────────────
/**
 * Returns a UTF-8 CSV string the frontend can offer as a template download.
 */
export const generateImportTemplate = (): string => {
  const header = "name,phone,className";
  const example = [
    "Nguyen Tuan Kiet,0848549959,Class 10A",
    "Tran Thi Lan,0912345678,Class 10A",
    "Le Van An,0376543210,Class 10B",
  ];
  return [header, ...example].join("\n");
};
