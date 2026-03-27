import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import usePageTitle from "@/hooks/usePageTitle";

function NotFoundPage() {
  usePageTitle("Not Found");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md space-y-4 text-center">
        <p className="text-5xl font-black text-primary">404</p>
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft className="h-4 w-4" />}>
            Go back
          </Button>
          <Button onClick={() => navigate("/")}>Go home</Button>
        </div>
      </Card>
    </div>
  );
}

export default NotFoundPage;
