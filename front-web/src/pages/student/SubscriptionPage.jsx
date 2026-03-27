import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Sparkles } from "lucide-react";
import * as subscriptionApi from "@/api/subscription";
import { getErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import * as toast from "@/utils/toast";
import usePageTitle from "@/hooks/usePageTitle";

const toData = (response) => {
  const root = response?.data ?? {};
  return root?.data ?? root;
};

const extractPlans = (response) => {
  const data = toData(response);
  return Array.isArray(data?.plans) ? data.plans : [];
};

const extractStatus = (response) => {
  const data = toData(response);
  return data ?? null;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(Number(value || 0));

const planOrder = ["free", "pro", "enterprise"];

const getPlanIcon = (id) => {
  if (id === "pro") return <Crown className="h-5 w-5 text-amber-500" />;
  if (id === "enterprise") return <Sparkles className="h-5 w-5 text-purple-500" />;
  return <Check className="h-5 w-5 text-green-600" />;
};

const buildFeatures = (plan) => {
  const maxStudents = plan?.maxStudents ?? 0;
  const maxTeachers = plan?.maxTeachers ?? 0;
  const maxEssays = plan?.maxEssaysPerMonth ?? 0;

  const studentLabel = maxStudents === -1 ? "Unlimited students" : `Up to ${maxStudents} students`;
  const teacherLabel = maxTeachers === -1 ? "Unlimited teachers" : `Up to ${maxTeachers} teachers`;
  const essayLabel = maxEssays === -1 ? "Unlimited essays / month" : `${maxEssays} essays / month`;

  return [studentLabel, teacherLabel, essayLabel, "AI grading included"];
};

function SubscriptionPage() {
  usePageTitle("Subscription");
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);

  const {
    data: plans = [],
    isLoading: isPlansLoading,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: subscriptionApi.getPlans,
    select: extractPlans,
  });

  const shouldFetchStatus = user?.role && user.role !== "free_student";

  const {
    data: status,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: subscriptionApi.getStatus,
    select: extractStatus,
    enabled: Boolean(shouldFetchStatus),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId) => subscriptionApi.checkout(planId),
    onSuccess: (response) => {
      const data = toData(response);
      const transaction = data?.transaction ?? data;
      setPaymentInfo(transaction);
      toast.success("Payment instructions created.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const currentPlanId =
    status?.subscription?.effectivePlan ?? status?.subscription?.plan ?? (user?.role === "free_student" ? "free" : "");

  const filteredPlans = useMemo(() => {
    const map = new Map(plans.map((plan) => [plan.id, plan]));
    return planOrder.map((id) => map.get(id)).filter(Boolean);
  }, [plans]);

  const handleCheckout = (planId) => {
    if (!planId || checkoutMutation.isPending) return;
    checkoutMutation.mutate(planId);
  };

  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  if (isPlansLoading || (shouldFetchStatus && isStatusLoading)) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[22px] bg-gray-200" />
        <div className="h-32 animate-pulse rounded-[22px] bg-gray-200" />
      </div>
    );
  }

  if (isPlansError || isStatusError) {
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Cannot load subscription</h2>
        <p className="text-sm text-gray-600">{getErrorMessage(plansError || statusError)}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => refetchPlans()}>Retry plans</Button>
          {shouldFetchStatus ? (
            <Button variant="secondary" onClick={() => refetchStatus()}>
              Retry status
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" subtitle="Choose the plan that fits your needs." />

      {user?.role === "center_student" ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Plan managed by center</p>
          <p className="text-sm text-gray-600">Contact your teacher or center admin for upgrades.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {filteredPlans.map((plan) => {
          const isCurrent = plan?.id === currentPlanId;
          const features = buildFeatures(plan);
          const showPopular = plan?.id === "pro";
          const priceLabel = plan?.priceVnd ? `${formatCurrency(plan.priceVnd)} VND / mo` : "Free";

          return (
            <Card
              key={plan?.id}
              className={[
                "space-y-4 border-2",
                isCurrent ? "border-primary" : "border-transparent",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlanIcon(plan?.id)}
                  <p className="text-lg font-bold text-gray-900">{plan?.name || "Plan"}</p>
                </div>
                {showPopular ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-black text-gray-900">{priceLabel}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              {user?.role === "free_student" ? (
                plan?.id === "pro" ? (
                  <Button onClick={() => handleCheckout("pro")} loading={checkoutMutation.isPending}>
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>
                    {plan?.id === "free" ? "Current plan" : "Contact sales"}
                  </Button>
                )
              ) : (
                <Button variant="secondary" disabled>
                  Center managed
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(paymentInfo)}
        onClose={() => setPaymentInfo(null)}
        title="Payment instructions"
        size="md"
      >
        {paymentInfo ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-2xl font-black text-primary">
                {formatCurrency(paymentInfo.amountVnd)} VND
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Bank", value: "SePay" },
                { label: "Account number", value: "See payment URL" },
                { label: "Amount", value: formatCurrency(paymentInfo.amountVnd) },
                { label: "Description", value: paymentInfo.orderCode || "Order code" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{item.value}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyText(item.value)}
                    className="mt-2"
                  >
                    Copy
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Use the description exactly as shown to match your transfer.
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">QR code URL</p>
              <p className="break-all text-sm text-gray-600">{paymentInfo.paymentUrl || "-"}</p>
              {paymentInfo.paymentUrl ? (
                <Button variant="secondary" onClick={() => window.open(paymentInfo.paymentUrl, "_blank")}>
                  Open payment URL
                </Button>
              ) : null}
            </div>

            <Button
              onClick={() => {
                setPaymentInfo(null);
                toast.success("Payment noted. We will confirm shortly.");
              }}
              fullWidth
            >
              I have transferred
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default SubscriptionPage;
