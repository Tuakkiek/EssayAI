/**
 * scripts/migrateSubscription.ts  (Phase 6)
 *
 * One-time migration: moves the `subscription` field from User (center_admin)
 * to the Center document.
 *
 * Run ONCE after deploying Phase 6:
 *   npx ts-node src/scripts/migrateSubscription.ts
 *
 * Safe to re-run — skips centers that already have a non-free plan set.
 */

import mongoose from "mongoose"
import Center   from "../models/Center"
import { User } from "../models/index"

// Inline the old User subscription shape (before Phase 0 removed it)
interface OldUserDoc {
  _id:      mongoose.Types.ObjectId
  role:     string
  centerId: mongoose.Types.ObjectId
  subscription?: {
    plan:      string
    startDate?: Date
    endDate?:   Date
    isActive:  boolean
  }
}

const run = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("MONGODB_URI not set")
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log("✓ Connected to MongoDB")

  // Find all center_admin users that still have a subscription field
  const admins = await (User as unknown as mongoose.Model<OldUserDoc>).find({
    role:         { $in: ["center_admin", "admin"] },
    "subscription.plan": { $exists: true },
  }).lean()

  console.log(`Found ${admins.length} admin user(s) with legacy subscription data`)

  let migrated = 0
  let skipped  = 0

  for (const admin of admins) {
    if (!admin.centerId || !admin.subscription) {
      skipped++
      continue
    }

    const center = await Center.findById(admin.centerId)
    if (!center) {
      console.warn(`  ⚠ Center not found for admin ${admin._id}`)
      skipped++
      continue
    }

    // Skip if Center already has a real plan (don't overwrite)
    if (center.subscription.plan !== "free") {
      console.log(`  → Skip ${center.name} — already on ${center.subscription.plan}`)
      skipped++
      continue
    }

    await Center.findByIdAndUpdate(center._id, {
      "subscription.plan":      admin.subscription.plan,
      "subscription.startDate": admin.subscription.startDate ?? null,
      "subscription.endDate":   admin.subscription.endDate   ?? null,
      "subscription.isActive":  admin.subscription.isActive  ?? true,
    })

    console.log(
      `  ✓ Migrated "${center.name}" → plan: ${admin.subscription.plan}` +
      (admin.subscription.endDate ? ` (expires ${admin.subscription.endDate.toISOString()})` : "")
    )
    migrated++
  }

  console.log(`\nDone. Migrated: ${migrated}  Skipped: ${skipped}`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error("Migration failed:", err)
  process.exit(1)
})
