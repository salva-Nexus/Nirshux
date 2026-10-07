// frontend/src/components/SessionGuard.jsx
//
// Hard session limit. The session starts the moment startSession() is called
// at login and ends SESSION_LIMIT_MS later — activity or inactivity makes no
// difference. The deadline is stored as an absolute timestamp, so refreshing
// the page, opening a new tab, or backgrounding the tab can't extend it.
import { useEffect } from "react";

export const SESSION_LIMIT_MS = 30 * 1000; // change this one number to adjust
export const SESSION_KEY = "sessionExpiresAt";
export const SESSION_FLAG = "sessionExpired";

export const startSession = () => {
  localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_LIMIT_MS));
};

// expired = true  → forced logout, SignIn shows the "session ended" notice
// expired = false → manual sign-out, no notice
export const endSession = (expired = true) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(SESSION_KEY);
  if (expired) sessionStorage.setItem(SESSION_FLAG, "1");
  window.location.replace("/signin");
};

const SessionGuard = () => {
  useEffect(() => {
    const check = () => {
      if (!localStorage.getItem("token")) return;
      const expiresAt = Number(localStorage.getItem(SESSION_KEY));
      // Missing/invalid deadline (e.g. a session from before this update) is
      // treated as expired — fail closed.
      if (!expiresAt || Date.now() >= expiresAt) endSession(true);
    };

    check();
    const interval = setInterval(check, 1000);

    // Browsers throttle timers in background tabs; re-check the instant the
    // tab is visible/focused again, and when another tab changes storage.
    const onVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    window.addEventListener("storage", check);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  return null;
};

export default SessionGuard;
