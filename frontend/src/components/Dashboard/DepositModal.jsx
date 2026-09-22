import React, { useEffect, useState } from "react";
import API from "../../api";

const DepositModal = ({ isOpen, onClose, refreshData }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && step === 2) {
      setLoading(true);
      setError("");

      API.get("/api/investor/whitelisted-wallets")
        .then((res) => {
          setWallets(res.data);
          if (res.data.length === 0) {
            setError("No payment gateways available. Contact admin.");
          }
        })
        .catch((err) => {
          console.error("GATEWAY_SYNC_CRITICAL_FAILURE", err);
          setError("Failed to load payment methods. Try again.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, step]);

  const reset = () => {
    setStep(1);
    setAmount("");
    setWallets([]);
    setSelectedWallet(null);
    setLoading(false);
    setStatus("idle");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  const handleFinalize = async () => {
    if (!selectedWallet) return;
    setLoading(true);

    try {
      await API.post("/api/investor/deposit-request", {
        amount: parseFloat(amount),
        coin: selectedWallet.symbol,
        network: selectedWallet.network,
        addressUsed: selectedWallet.address,
      });

      setStatus("success");
      refreshData();

      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      console.error("Deposit request error:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4">
      <button
        aria-label="Close deposit modal"
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={handleClose}
      />

      <div className={`fixed left-1/2 top-8 z-[300] -translate-x-1/2 transition-all duration-300 ${showToast ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"}`}>
        <div className="rounded-full border border-nirshux-accent/20 bg-[#11161A] px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-nirshux-accent shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          ✓ Copied to clipboard
        </div>
      </div>

      <div className="relative my-8 w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0F1418] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="h-px bg-gradient-to-r from-transparent via-nirshux-accent/70 to-transparent" />

        <div className="border-b border-white/[0.06] px-6 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-nirshux-accent">
                Funding desk
              </p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                Deposit Funds
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] text-xl text-gray-600 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-[7px] font-black uppercase tracking-[0.18em] text-gray-600">
              <span>Protocol progress</span>
              <span>{step}/3</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-nirshux-accent shadow-[0_0_12px_rgba(0,242,195,0.45)] transition-all duration-500"
                style={{ width: progress }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-3">
              <div className="mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-600">01 · Define capital</p>
                <p className="mt-1 text-[10px] text-gray-500">Enter the amount you intend to fund.</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-5">
                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Deposit amount · USD
                </label>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-3xl font-black text-gray-700">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-4xl font-black tracking-[-0.04em] text-white outline-none placeholder:text-gray-800"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {["200", "500", "1000", "5000"].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] py-3 text-[9px] font-black text-gray-500 transition hover:border-nirshux-accent/20 hover:bg-nirshux-accent/10 hover:text-nirshux-accent"
                  >
                    ${value}
                  </button>
                ))}
              </div>

              <button
                disabled={!amount || Number(amount) <= 0}
                onClick={() => setStep(2)}
                className="mt-7 w-full rounded-2xl bg-nirshux-accent py-4 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:shadow-[0_0_30px_rgba(0,242,195,0.2)] disabled:opacity-20"
              >
                Continue to selection →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-3">
              <button
                onClick={() => setStep(1)}
                className="mb-5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-600 hover:text-white"
              >
                ← Back to amount
              </button>

              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-600">02 · Select gateway</p>
              <h3 className="mt-1 text-lg font-black uppercase text-white">
                Available payment routes
              </h3>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-4">
                  <p className="text-[9px] font-bold text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-5 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                {loading ? (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-nirshux-accent" />
                    <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                      Syncing secure nodes
                    </p>
                  </div>
                ) : wallets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-red-400/15 bg-red-400/[0.03] py-14 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-400">No gateways available</p>
                    <p className="mt-1 text-[8px] text-gray-600">Contact support</p>
                  </div>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet._id}
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setStep(3);
                      }}
                      className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-left transition hover:border-nirshux-accent/20 hover:bg-nirshux-accent/[0.035]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-nirshux-accent/10 bg-nirshux-accent/10 text-[10px] font-black text-nirshux-accent">
                          {wallet.symbol}
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-white">{wallet.coinName}</p>
                          <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-600">{wallet.network}</p>
                        </div>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] text-gray-600 transition group-hover:border-nirshux-accent/20 group-hover:bg-nirshux-accent group-hover:text-black">
                        →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 3 && selectedWallet && (
            <div className="animate-in fade-in zoom-in-95">
              <button
                onClick={() => setStep(2)}
                className="mb-5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-600 hover:text-white"
              >
                ← Change method
              </button>

              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-nirshux-accent">
                  03 · Complete payment
                </p>
                <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                  Send exactly
                </h3>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nirshux-accent text-lg font-black text-black">
                    {selectedWallet.symbol[0]}
                  </div>
                  <div>
                    <p className="text-xl font-black text-white">{amount} {selectedWallet.symbol}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-600">
                      ${parseFloat(amount).toLocaleString()} USD · {selectedWallet.network}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Deposit address
                </p>
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/25 p-3">
                  <code className="min-w-0 flex-1 break-all text-[9px] leading-relaxed text-nirshux-accent">
                    {selectedWallet.address}
                  </code>
                  <button
                    onClick={() => handleCopy(selectedWallet.address)}
                    className="shrink-0 rounded-lg bg-nirshux-accent/10 px-3 py-2 text-[8px] font-black text-nirshux-accent transition hover:bg-nirshux-accent hover:text-black"
                  >
                    COPY
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.035] p-4">
                <div className="flex gap-3">
                  <span className="text-amber-400">!</span>
                  <p className="text-[8px] leading-relaxed text-amber-100/50">
                    <strong className="text-amber-400">Network warning:</strong> Send only {selectedWallet.symbol} over {selectedWallet.network}. Cross-chain errors may result in loss.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/[0.06] bg-black/15 p-4">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-700">Status</p>
                  <p className="mt-1 text-[9px] font-black uppercase text-nirshux-accent">Awaiting payment</p>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-700">Confirmations</p>
                  <p className="mt-1 text-[9px] font-black text-white">0 / 3</p>
                </div>
              </div>

              <button
                onClick={handleFinalize}
                disabled={loading}
                className={`mt-5 w-full rounded-2xl py-4 text-[10px] font-black uppercase tracking-[0.18em] transition-all disabled:opacity-60 ${
                  status === "success"
                    ? "bg-emerald-500 text-white"
                    : status === "error"
                      ? "bg-red-500 text-white"
                      : "bg-white text-black hover:bg-nirshux-accent"
                }`}
              >
                {loading ? "Transmitting..." : status === "success" ? "✓ Logged" : status === "error" ? "✕ Failed" : "Confirm deposit"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
