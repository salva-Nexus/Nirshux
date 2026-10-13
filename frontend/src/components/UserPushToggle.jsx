// frontend/src/components/UserPushToggle.jsx
import React, { useCallback, useEffect, useState } from "react";
import API from "../api";

const urlBase64ToUint8Array = (b64) => {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

// True only if the browser subscription was made with the SAME server key.
const sameKey = (sub, key) => {
  try {
    const current = new Uint8Array(sub.options.applicationServerKey);
    const wanted = urlBase64ToUint8Array(key);
    return (
      current.length === wanted.length &&
      current.every((v, i) => v === wanted[i])
    );
  } catch (_) {
    return false;
  }
};

const supported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const getRegistration = async () => {
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
};

const UserPushToggle = ({ onNotify }) => {
  const [state, setState] = useState("loading"); // loading | unsupported | blocked | off | on | busy
  const notify = useCallback((m) => onNotify && onNotify(m), [onNotify]);

  const syncToServer = (sub) =>
    API.post("/api/investor/push/subscribe", { subscription: sub.toJSON() });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported()) return !cancelled && setState("unsupported");
      if (Notification.permission === "denied")
        return !cancelled && setState("blocked");
      try {
        const reg = await getRegistration();
        const sub = await reg.pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          syncToServer(sub).catch(() => {}); // re-save silently if the DB lost it
          return !cancelled && setState("on");
        }
        !cancelled && setState("off");
      } catch (_) {
        !cancelled && setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async (reg, key) => {
    const opts = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    };
    try {
      return await reg.pushManager.subscribe(opts);
    } catch (err) {
      const old = await reg.pushManager.getSubscription();
      if (old) await old.unsubscribe();
      return reg.pushManager.subscribe(opts);
    }
  };

  const enable = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }

      const reg = await getRegistration();
      const { data } = await API.get("/api/investor/push/public-key");

      let sub = await reg.pushManager.getSubscription();
      if (sub && !sameKey(sub, data.key)) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) sub = await subscribe(reg, data.key);

      await syncToServer(sub);

      const test = await API.post("/api/investor/push/test");
      if (!test.data?.ok) {
        const reason =
          (test.data?.errors && test.data.errors[0]) || "NOT_DELIVERED";
        setState("off");
        notify(`PUSH_FAILED: ${String(reason).slice(0, 80)}`);
        return;
      }

      setState("on");
      notify("PUSH_ALERTS_ENABLED");
    } catch (err) {
      console.error("Push enable failed:", err);
      setState("off");
      notify(err.response?.data?.msg || "PUSH_SETUP_FAILED");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await getRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await API.post("/api/investor/push/unsubscribe", {
          endpoint: sub.endpoint,
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
      notify("PUSH_ALERTS_DISABLED");
    } catch (err) {
      console.error("Push disable failed:", err);
      setState("on");
    }
  };

  const isOn = state === "on";
  const busy = state === "busy" || state === "loading";
  const disabled = busy || state === "blocked" || state === "unsupported";

  const statusText =
    state === "unsupported"
      ? "Not supported on this browser. On iPhone, add the site to your Home Screen first."
      : state === "blocked"
        ? "Blocked in your browser settings. Allow notifications for this site, then reload."
        : isOn
          ? "You'll be notified when deposits, withdrawals and support replies are updated."
          : "Get notified when deposits, withdrawals and support replies are updated.";

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">
        Push Notifications
      </label>
      <div className="flex items-center justify-between gap-6">
        <p className="text-sm text-gray-300 leading-relaxed">{statusText}</p>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          disabled={disabled}
          onClick={isOn ? disable : enable}
          className={`relative w-14 h-8 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            isOn ? "bg-nirshux-accent" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              isOn ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default UserPushToggle;
