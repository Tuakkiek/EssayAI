import { AuthProvider } from "@/context/AuthContext";
import AppRouter from "@/router";
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
