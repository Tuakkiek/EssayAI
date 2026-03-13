# Fix Free Student Registration - Email Already Exists Error

## Steps:

### 1. Analysis [x]

- Confirmed error: Duplicate email check fails despite email optional for free_student
- Client LoginScreen.tsx: No email field
- Suspect: authApi.register sends email param

### 2. Verify API Payload [x]

- Read mobile-app/src/services/api.ts → No email sent in authApi.register payload

### 3. Backend Fix [x]

- Edit authService.ts: Skip email duplicate check for free_student role

### 4. Test [x]

- Backend fix applied successfully
- Email duplicate check now skipped ONLY for free_student (teachers keep check)
- Ready for testing (server not started yet)

- cd backend-api && npm run dev
- Test POST /api/auth/register with duplicate email as free_student

### 5. Client UX []

- Optional: Update LoginScreen validation/docs

### 6. Completion [ ]
