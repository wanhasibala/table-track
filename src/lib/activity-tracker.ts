const STORAGE_KEY = "lastActivity";
const THROTTLE_MS = 5000;

class ActivityTracker {
  private started = false;
  private lastActivity = 0;
  private lastPersistedAt = 0;

  private readonly handleActivity = () => {
    this.markActive();
  };

  private readonly handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      this.markActive();
    }
  };

  private readonly handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    const nextActivity = Number(event.newValue);
    if (!Number.isFinite(nextActivity) || nextActivity <= this.lastActivity) {
      return;
    }

    this.lastActivity = nextActivity;
  };

  private readStoredActivity(): number {
    if (typeof window === "undefined") {
      return this.lastActivity;
    }

    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const parsedValue = storedValue ? Number(storedValue) : 0;
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private persistActivity(timestamp: number) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, String(timestamp));
    this.lastPersistedAt = timestamp;
  }

  start(): void {
    if (this.started || typeof window === "undefined") {
      return;
    }

    this.started = true;
    this.lastActivity = this.readStoredActivity() || Date.now();
    this.persistActivity(this.lastActivity);

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("storage", this.handleStorage);
  }

  markActive(): void {
    const now = Date.now();
    this.lastActivity = now;

    if (now - this.lastPersistedAt >= THROTTLE_MS || this.lastPersistedAt === 0) {
      this.persistActivity(now);
    }
  }

  getLastActivity(): number {
    if (!this.lastActivity) {
      this.lastActivity = this.readStoredActivity();
    }

    return this.lastActivity;
  }

  isIdle(thresholdMs: number): boolean {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) {
      return false;
    }

    return Date.now() - lastActivity >= thresholdMs;
  }
}

export const activityTracker = new ActivityTracker();