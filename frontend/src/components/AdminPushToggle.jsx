// frontend/src/components/AdminPushToggle.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import API from "../api";

const urlBase64ToUint8Array = (b64) => {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
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

const AdminPushToggle = ({ onNotify }) => {
  const [state, setState] = useState("loading"); // loading | unsupported | blocked | off | on | busy
  const notify = useCallback((m) => onNotify && onNotify(m), [onNotify]);

  const syncToServer = (sub) =>
    API.post("/api/admin/push/subscribe", { subscription: sub.toJSON() });

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
          syncToServer(sub).catch(() => {}); // re-register silently if DB lost it
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
      // Stale subscription from an old VAPID key — drop it and retry once
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
      const { data } = await API.get("/api/admin/push/public-key");
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await subscribe(reg, data.key));
      await syncToServer(sub);
      await API.post("/api/admin/push/test");
      setState("on");
      notify("PUSH ALERTS ENABLED");
    } catch (err) {
      console.error("Push enable failed:", err);
      setState("off");
      notify(err.response?.data?.msg || "PUSH SETUP FAILED");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await getRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await API.post("/api/admin/push/unsubscribe", {
          endpoint: sub.endpoint,
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
      notify("PUSH ALERTS DISABLED");
    } catch (err) {
      console.error("Push disable failed:", err);
      setState("on");
    }
  };

  if (state === "loading" || state === "unsupported") return null;

  const isOn = state === "on";
  const isBlocked = state === "blocked";

  return (
    <button
      type="button"
      disabled={state === "busy" || isBlocked}
      onClick={isOn ? disable : enable}
      className={`w-full p-3 rounded-xl text-xs font-bold mb-2 uppercase flex items-center justify-between gap-2 transition-all disabled:opacity-60 ${
        isOn
          ? "text-nirshux-accent bg-nirshux-accent/10 hover:bg-nirshux-accent/20"
          : "text-gray-300 bg-white/5 hover:bg-white/10"
      }`}
    >
      <span className="flex items-center gap-2">
        {state === "busy" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isOn ? (
          <Bell size={14} />
        ) : (
          <BellOff size={14} />
        )}
        {isBlocked ? "Push Blocked In Browser" : "Push Alerts"}
      </span>
      {!isBlocked && (
        <span
          className={`text-[9px] tracking-wide px-2 py-0.5 rounded-full border ${
            isOn
              ? "border-nirshux-accent/40 text-nirshux-accent"
              : "border-white/10 text-gray-500"
          }`}
        >
          {isOn ? "ON" : "OFF"}
        </span>
      )}
    </button>
  );
};

export default AdminPushToggle;
