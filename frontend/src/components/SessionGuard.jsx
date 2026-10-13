// frontend/src/components/SessionGuard.jsx
//
// Inactivity logout. The deadline is a sliding timestamp in localStorage:
// every real user action pushes it SESSION_LIMIT_MS into the future, and if
// it passes with no activity the user is signed out. Because it is stored as
// an absolute timestamp, refreshes, new tabs and background-throttled timers
// can't extend it, and activity in any tab counts for all tabs.
import { useEffect } from "react";

export const SESSION_LIMIT_MS = 180 * 60 * 1000; // 5 minutes of inactivity
export const SESSION_KEY = "sessionExpiresAt";
export const SESSION_FLAG = "sessionExpired";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];
const WRITE_THROTTLE_MS = 1000; // don't hammer localStorage on every mouse move

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
    let lastWrite = 0;

    // Logs out if the deadline has passed. Returns true if the session is alive.
    const check = () => {
      if (!localStorage.getItem("token")) return false;
      const expiresAt = Number(localStorage.getItem(SESSION_KEY));
      // Missing/invalid deadline (e.g. a session from before this update) is
      // treated as expired — fail closed.
      if (!expiresAt || Date.now() >= expiresAt) {
        endSession(true);
        return false;
      }
      return true;
    };

    // Real activity slides the deadline forward — but only if the session is
    // still alive, so activity can never resurrect an already-expired session.
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      if (!check()) return;
      lastWrite = now;
      localStorage.setItem(SESSION_KEY, String(now + SESSION_LIMIT_MS));
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
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true }),
    );

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, onActivity),
      );
    };
  }, []);

  return null;
};

export default SessionGuard;
