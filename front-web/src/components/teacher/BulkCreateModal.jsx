import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Link2, XCircle } from "lucide-react";
import * as teacherApi from "@/api/teacher";
import { getErrorMessage } from "@/api/client";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as toast from "@/utils/toast";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeBulkResult = (response) => {
  const data = toData(response);

  return {
    total: toNumber(data?.total),
    createdCount: toNumber(data?.createdCount),
    linkedCount: toNumber(data?.linkedCount),
    errorCount: toNumber(data?.errorCount),
    results: Array.isArray(data?.results)
      ? data.results.map((row) => ({
          rowNumber: toNumber(row?.rowNumber),
          name: row?.name || "",
          phone: row?.phone || "",
          status: row?.status || "error",
          userId: row?.userId || "",
          tempPassword: row?.tempPassword || "",
          reason: row?.reason || "",
        }))
      : [],
  };
};

const getStatusBadge = (status) => {
  if (status === "created") {
    return {
      label: "Created",
      className: "bg-green-100 text-green-700",
      icon: <CheckCircle2 className="h-4 w-4" />,
    };
  }

  if (status === "linked") {
    return {
      label: "Linked",
      className: "bg-blue-100 text-blue-700",
      icon: <Link2 className="h-4 w-4" />,
    };
  }

  return {
    label: "Error",
    className: "bg-red-100 text-red-700",
    icon: <XCircle className="h-4 w-4" />,
  };
};

/**
 * Modal for bulk student creation and linking in a class.
 */
function BulkCreateModal({ open, onClose, classId, onSuccess }) {
  const [countInput, setCountInput] = useState("5");
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);

  const createMutation = useMutation({
    mutationFn: (students) => teacherApi.bulkCreateStudents(classId, students),
    onSuccess: (response) => {
      const normalized = normalizeBulkResult(response);
      setResult(normalized);

      toast.success(
        `Done: ${normalized.createdCount} created, ${normalized.linkedCount} linked, ${normalized.errorCount} errors.`,
      );

      if (typeof onSuccess === "function") {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const canGenerate = useMemo(() => {
    const count = toNumber(countInput);
    return count >= 1 && count <= 50;
  }, [countInput]);

  const handleGenerateRows = () => {
    const count = Math.min(50, Math.max(1, toNumber(countInput)));
    const nextRows = Array.from({ length: count }, (_, index) => ({
      rowNumber: index + 1,
      phone: "",
      name: "",
    }));
    setRows(nextRows);
    setResult(null);
  };

  const handleRowChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }
        return {
          ...row,
          [field]: value,
        };
      }),
    );
  };

  const handleSubmit = () => {
    if (rows.length === 0) {
      toast.error("Generate rows first.");
      return;
    }

    const payload = rows.map((row) => ({
      name: row.name.trim(),
      phone: row.phone.trim(),
    }));

    const hasMissing = payload.some((row) => !row.name || !row.phone);
    if (hasMissing) {
      toast.error("Please fill name and phone for all rows.");
      return;
    }

    createMutation.mutate(payload);
  };

  const resetBuilder = () => {
    setRows([]);
    setResult(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Them hoc sinh hang loat" size="lg">
      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="space-y-3">
            <Input
              label="So luong hoc sinh"
              type="number"
              min={1}
              max={50}
              value={countInput}
              onChange={(event) => setCountInput(event.target.value)}
              hint="Toi da 50 hoc sinh moi lan."
            />
            <Button onClick={handleGenerateRows} disabled={!canGenerate}>
              Tao bang nhap
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">So dien thoai</th>
                    <th className="px-3 py-2 font-semibold">Ho va ten</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.rowNumber} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-700">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.phone}
                          onChange={(event) =>
                            handleRowChange(index, "phone", event.target.value)
                          }
                          placeholder="Vi du: 0912345678"
                          className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-primary"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(event) =>
                            handleRowChange(index, "name", event.target.value)
                          }
                          placeholder="Nguyen Van A"
                          className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSubmit} loading={createMutation.isPending}>
                Submit
              </Button>
              <Button variant="secondary" onClick={resetBuilder} disabled={createMutation.isPending}>
                Nhap lai
              </Button>
            </div>
          </>
        )}

        {result ? (
          <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-800">
              Ket qua: {result.createdCount} created, {result.linkedCount} linked,{" "}
              {result.errorCount} errors
            </p>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Ten</th>
                    <th className="px-3 py-2 font-semibold">SDT</th>
                    <th className="px-3 py-2 font-semibold">Trang thai</th>
                    <th className="px-3 py-2 font-semibold">Mat khau tam</th>
                    <th className="px-3 py-2 font-semibold">Ghi chu</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((row) => {
                    const status = getStatusBadge(row.status);
                    return (
                      <tr key={`${row.rowNumber}-${row.phone}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-700">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-gray-800">{row.name || "-"}</td>
                        <td className="px-3 py-2 text-gray-800">{row.phone || "-"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">
                          {row.tempPassword || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.reason || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default BulkCreateModal;
