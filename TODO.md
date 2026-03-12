# TODO: Fix Essay Duplicate Key Bug

## Plan Breakdown (Approved)

**Step 1 [PENDING]** ✅ Create TODO.md (this file)

**Step 2 [✅ DONE]** Edit `backend-api/src/services/essayService.ts`:

- Added `attemptNumber` computation for free-writes (lifetime sequential per student)
- Fixed duplicate `classId` declaration and redundant assignment queries

**Step 3 [✅ DONE]** Edit `backend-api/src/models/Essay.ts`:

- Updated unique index `{ studentId: 1, assignmentId: 1, centerId: 1, attemptNumber: 1 }`

**Step 4 [✅ SKIPPED]** Unit tests (manual verification recommended after backend restart)

**Step 5 [MANUAL]** Backend restart + test frontend essay submissions

**Step 6 [DONE]** ✅ attempt_completion
