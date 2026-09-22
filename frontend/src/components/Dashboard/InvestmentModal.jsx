import React, { useState } from "react";
import API from "../../api";
import { INVESTMENT_PLANS } from "../../constants/plans";

const InvestmentModal = ({
  isOpen,
  onClose,
  refreshData,
  disabledPlans = [],
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  if (!isOpen) return null;

  const plans = INVESTMENT_PLANS.filter((p) => !disabledPlans.includes(p.name));

  const handleClose = () => {
    setSelectedPlan(null);
    setAmount("");
    setStatus({ type: "", msg: "" });
    onClose();
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const numericAmount = Number(amount);
    setLoading(true);
    setStatus({ type: "", msg: "" });

    if (numericAmount < selectedPlan.min) {
      setStatus({
        type: "error",
        msg: `Minimum allocation is $${selectedPlan.min.toLocaleString()}.`,
      });
      setLoading(false);
      return;
    }

    if (selectedPlan.max && numericAmount > selectedPlan.max) {
      setStatus({
        type: "error",
        msg: `Maximum allocation is $${selectedPlan.max.toLocaleString()}.`,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await API.post(
        "/api/investor/invest",
        {
          amount: numericAmount,
          planName: selectedPlan.name,
          dailyRoi: selectedPlan.dailyValue,
          durationDays: selectedPlan.days,
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } },
      );

      setStatus({ type: "success", msg: response.data.msg });
      setTimeout(() => {
        refreshData();
        handleClose();
      }, 1600);
    } catch (err) {
      const code = err.response?.data?.msg;
      const friendlyMsg =
        code === "PLAN_NOT_AVAILABLE"
          ? "This plan is no longer available to your account."
          : code || "Transaction failed.";
      setStatus({ type: "error", msg: friendlyMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 backdrop-blur-xl">
      <div className="min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0F1418] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
          <div className="h-px bg-gradient-to-r from-transparent via-nirshux-accent/70 to-transparent" />

          <div className="border-b border-white/[0.06] p-6 md:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-nirshux-accent shadow-[0_0_10px_rgba(0,242,195,0.8)]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-nirshux-accent">
                    Capital Desk
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[-0.03em] text-white">
                  {selectedPlan ? "Confirm Allocation" : "Select Capital Plan"}
                </h2>
                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-600">
                  {selectedPlan
                    ? `Deploying to ${selectedPlan.name}`
                    : "Choose an allocation protocol"}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] text-xl text-gray-500 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-400"
              >
                ×
              </button>
            </div>
          </div>

          {status.msg && (
            <div
              className={`mx-6 mt-6 rounded-2xl border p-4 text-[9px] font-black uppercase tracking-[0.14em] md:mx-8 ${
                status.type === "error"
                  ? "border-red-400/15 bg-red-400/[0.06] text-red-400"
                  : "border-nirshux-accent/15 bg-nirshux-accent/[0.06] text-nirshux-accent"
              }`}
            >
              {status.msg}
            </div>
          )}

          <div className="p-6 md:p-8">
            {!selectedPlan ? (
              plans.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.015] py-20 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
                    No investment plans currently available
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan)}
                      className={`group relative overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] ${
                        plan.popular
                          ? "border-nirshux-accent/25 bg-nirshux-accent/[0.045]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-nirshux-accent/20"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute right-4 top-4 rounded-full border border-nirshux-accent/20 bg-nirshux-accent/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-widest text-nirshux-accent">
                          High Yield
                        </span>
                      )}

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-2xl">
                        {plan.icon}
                      </div>

                      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                        {plan.name}
                      </p>
                      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">
                        {plan.roi}
                        <span className="ml-1.5 text-[8px] font-black uppercase tracking-widest text-gray-600">
                          daily
                        </span>
                      </p>

                      <div className="mt-5 space-y-2.5 border-t border-white/[0.06] pt-4">
                        {[
                          ["Min stake", `$${plan.min.toLocaleString()}`],
                          ["Max stake", `$${plan.max.toLocaleString()}`],
                          ["Lock term", plan.duration],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">
                              {label}
                            </span>
                            <span className="text-[9px] font-bold uppercase text-gray-300">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                          Open plan
                        </span>
                        <span className="text-nirshux-accent transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="mx-auto max-w-md">
                <form onSubmit={handleInvest} className="space-y-5">
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.025] p-7 text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.22em] text-gray-600">
                      Capital allocation · USD
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <span className="text-3xl font-black text-gray-700">
                        $
                      </span>
                      <input
                        type="number"
                        min={selectedPlan.min}
                        max={selectedPlan.max}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`${selectedPlan.min.toLocaleString()}–${selectedPlan.max.toLocaleString()}`}
                        className="w-full max-w-[250px] bg-transparent text-center text-4xl font-black tracking-[-0.04em] text-nirshux-accent outline-none placeholder:text-lg placeholder:text-gray-700"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="mt-5 flex justify-center gap-2">
                      <span className="rounded-full bg-white/[0.035] px-2.5 py-1 text-[8px] font-bold text-gray-600">
                        MIN ${selectedPlan.min.toLocaleString()}
                      </span>
                      <span className="rounded-full bg-white/[0.035] px-2.5 py-1 text-[8px] font-bold text-gray-600">
                        MAX ${selectedPlan.max.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full rounded-2xl bg-nirshux-accent py-4.5 text-sm font-black uppercase tracking-[0.16em] text-black transition-all hover:shadow-[0_0_35px_rgba(0,242,195,0.2)] disabled:opacity-50"
                  >
                    {loading
                      ? "Initializing..."
                      : `Execute $${Number(amount || 0).toLocaleString()} Stake`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="w-full py-2 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 transition hover:text-white"
                  >
                    ← Return to plans
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
