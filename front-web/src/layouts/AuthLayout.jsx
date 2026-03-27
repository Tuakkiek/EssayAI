import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Essay AI</h1>
          <p className="mt-2 text-sm text-textMuted">
            Learn writing better, one essay at a time.
          </p>
        </div>
        <Outlet />
      </div>
    </main>
  );
}

export default AuthLayout;
