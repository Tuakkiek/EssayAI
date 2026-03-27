import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import * as adminApi from "@/api/admin";
import { getErrorMessage } from "@/api/client";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "center_student", label: "Center student" },
  { value: "free_student", label: "Free student" },
];

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractUsers = (response) => {
  const data = toData(response);
  const users = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
  const pagination = data?.pagination ?? {};

  return {
    users,
    pagination: {
      total: Number(pagination?.total ?? 0),
      page: Number(pagination?.page ?? 1),
      limit: Number(pagination?.limit ?? 20),
      pages: Number(pagination?.pages ?? pagination?.totalPages ?? 1),
    },
  };
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getRoleBadge = (role) => {
  if (role === "admin") return "bg-purple-100 text-purple-700";
  if (role === "teacher") return "bg-blue-100 text-blue-700";
  if (role === "center_student") return "bg-green-100 text-green-700";
  if (role === "free_student") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
};

function UsersPage() {
  usePageTitle("Users");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [debouncedSearch, roleFilter]);

  const queryKey = useMemo(
    () => ["admin-users", { page, limit, search: debouncedSearch, role: roleFilter }],
    [page, limit, debouncedSearch, roleFilter],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      adminApi.getUsers({
        page,
        limit,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      }),
    select: extractUsers,
    keepPreviousData: true,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminApi.toggleUserActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((user) =>
            user._id === id || user.id === id ? { ...user, isActive } : user,
          ),
        };
      });

      return { previous };
    },
    onError: (submitError, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getErrorMessage(submitError));
    },
    onSuccess: () => {
      toast.success("User updated.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination ?? { page: 1, pages: 1 };

  const handleToggle = (user) => {
    const userId = user?._id ?? user?.id ?? "";
    if (!userId) return;

    const nextActive = !user?.isActive;
    const confirmLabel = nextActive ? "activate" : "disable";

    const shouldProceed = window.confirm(`Do you want to ${confirmLabel} this user?`);
    if (!shouldProceed) return;

    toggleMutation.mutate({ id: userId, isActive: nextActive });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load users</h2>
        <p className="text-sm text-gray-600" role="alert">
          {getErrorMessage(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Search and manage platform users." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, or email"
            className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="h-11 rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-primary"
        >
          {ROLE_FILTERS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users found" body="Try another search or filter." />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <Card key={user?._id ?? user?.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{user?.name || "Unnamed"}</p>
                    <p className="text-xs text-gray-500">{user?.email || user?.phone || "-"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadge(user?.role)}`}>
                    {user?.role || "unknown"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      user?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                    ].join(" ")}
                  >
                    {user?.isActive ? "Active" : "Disabled"}
                  </span>
                  <span>Joined: {formatDate(user?.createdAt)}</span>
                </div>
                <Button
                  size="sm"
                  variant={user?.isActive ? "secondary" : "primary"}
                  onClick={() => handleToggle(user)}
                  loading={toggleMutation.isPending && toggleMutation.variables?.id === (user?._id ?? user?.id)}
                >
                  {user?.isActive ? "Disable" : "Activate"}
                </Button>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone / Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user?._id ?? user?.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">{user?.name || "Unnamed"}</td>
                    <td className="px-4 py-3 text-gray-600">{user?.email || user?.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadge(user?.role)}`}>
                        {user?.role || "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          user?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {user?.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(user?.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={user?.isActive ? "secondary" : "primary"}
                        onClick={() => handleToggle(user)}
                        loading={toggleMutation.isPending && toggleMutation.variables?.id === (user?._id ?? user?.id)}
                      >
                        {user?.isActive ? "Disable" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(nextPage) => setPage(nextPage)}
      />
    </div>
  );
}

export default UsersPage;
