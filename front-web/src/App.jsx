import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import EssayInputPage from "./pages/EssayInputPage";
import EssayResultPage from "./pages/EssayResultPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import TeacherClassesPage from "./pages/teacher/TeacherClassesPage";
import TeacherClassDetailPage from "./pages/teacher/TeacherClassDetailPage";
import TeacherAssignmentsPage from "./pages/teacher/TeacherAssignmentsPage";
import TeacherAssignmentFormPage from "./pages/teacher/TeacherAssignmentFormPage";
import TeacherAssignmentDetailPage from "./pages/teacher/TeacherAssignmentDetailPage";
import TeacherSubmissionReviewPage from "./pages/teacher/TeacherSubmissionReviewPage";
import TeacherClassStudentAddPage from "./pages/teacher/TeacherClassStudentAddPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { isAuthenticated } from "./services/api";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated() ? "/home" : "/login"} replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/essay/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/essay/input"
          element={
            <ProtectedRoute>
              <EssayInputPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <AssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/essay/result"
          element={
            <ProtectedRoute>
              <EssayResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes/:classId"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherClassDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes/:classId/add-students"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherClassStudentAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherAssignmentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/create"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherAssignmentFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments/:id/edit"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherAssignmentFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/submissions/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherSubmissionReviewPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
