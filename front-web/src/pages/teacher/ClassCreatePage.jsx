import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const getClassId = (item) => item?._id ?? item?.id ?? "";

function ClassCreatePage() {
  usePageTitle("Create Class");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const createClassMutation = useMutation({
    mutationFn: (payload) => teacherApi.createClass(payload),
    onSuccess: (response) => {
      const data = toData(response);
      const cls = data?.class ?? data;
      const newId = getClassId(cls);

      toast.success("Class created successfully.");

      if (newId) {
        navigate(`/teacher/classes/${encodeURIComponent(newId)}`, { replace: true });
        return;
      }

      navigate("/teacher/classes", { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = "Class name is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createClassMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Class"
        subtitle="Set up a class and start inviting students."
        backHref="/teacher/classes"
      />

      <Card className="max-w-2xl space-y-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Class name"
            placeholder="Example: IELTS Writing 12A"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />

          <Input
            label="Description (optional)"
            placeholder="Class notes, schedule, or objective"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" loading={createClassMutation.isPending}>
              Tao lop
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/teacher/classes")}
              disabled={createClassMutation.isPending}
            >
              Huy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ClassCreatePage;
