import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/layouts/AdminLayout";
import AuthLayout from "@/layouts/AuthLayout";
import StudentLayout from "@/layouts/StudentLayout";
import TeacherLayout from "@/layouts/TeacherLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";
import UsersPage from "@/pages/admin/UsersPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import StudentAssignmentDetailPage from "@/pages/student/AssignmentDetailPage";
import AssignmentsPage from "@/pages/student/AssignmentsPage";
import EssayInputPage from "@/pages/student/EssayInputPage";
import EssayResultPage from "@/pages/student/EssayResultPage";
import HistoryPage from "@/pages/student/HistoryPage";
import ProgressPage from "@/pages/student/ProgressPage";
import StudentProfilePage from "@/pages/student/StudentProfilePage";
import StudentHomePage from "@/pages/student/StudentHomePage";
import SubscriptionPage from "@/pages/student/SubscriptionPage";
import ImprovementPage from "@/pages/student/ImprovementPage";
import AssignmentCreatePage from "@/pages/teacher/AssignmentCreatePage";
import TeacherAssignmentDetailPage from "@/pages/teacher/AssignmentDetailPage";
import TeacherAssignmentsPage from "@/pages/teacher/AssignmentsPage";
import ClassCreatePage from "@/pages/teacher/ClassCreatePage";
import ClassDetailPage from "@/pages/teacher/ClassDetailPage";
import ClassesPage from "@/pages/teacher/ClassesPage";
import SubmissionDetailPage from "@/pages/teacher/SubmissionDetailPage";
import SubmissionsPage from "@/pages/teacher/SubmissionsPage";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import TeacherProfilePage from "@/pages/teacher/TeacherProfilePage";
import TeacherProgressPage from "@/pages/teacher/TeacherProgressPage";

const getHomePathByRole = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "teacher") {
    return "/teacher/progress";
  }

  if (role === "center_student" || role === "free_student") {
    return "/student";
  }

  return "/login";
};

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-textMuted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomePathByRole(user.role)} replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-medium text-textMuted">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathByRole(user.role)} replace />;
  }

  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["center_student", "free_student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="essay/write" element={<EssayInputPage />} />
        <Route path="essay/:id" element={<EssayResultPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/:id" element={<StudentAssignmentDetailPage />} />
        <Route path="improvement" element={<ImprovementPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboardPage />} />
        <Route path="progress" element={<TeacherProgressPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/create" element={<ClassCreatePage />} />
        <Route path="classes/:id" element={<ClassDetailPage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="assignments/create" element={<AssignmentCreatePage />} />
        <Route path="assignments/:id" element={<TeacherAssignmentDetailPage />} />
        <Route path="assignments/:id/submissions" element={<SubmissionsPage />} />
        <Route path="submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
