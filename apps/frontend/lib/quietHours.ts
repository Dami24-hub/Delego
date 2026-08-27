export interface QuietHoursConfig {
  enabled: boolean;
  /** Start time in HH:mm 24-hour format (e.g. "22:00") */
  startTime: string;
  /** End time in HH:mm 24-hour format (e.g. "07:00") */
  endTime: string;
  /** Days of week when quiet hours apply (0=Sun, 1=Mon, ..., 6=Sat) */
  daysOfWeek: number[];
  /** Whether approval/urgent alerts bypass quiet hours */
  bypassApprovals: boolean;
  /** Optional Intl time zone (defaults to user's local timezone) */
  timeZone?: string;
}

export const DEFAULT_QUIET_HOURS: QuietHoursConfig = {
  enabled: false,
  startTime: "22:00",
  endTime: "07:00",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  bypassApprovals: true,
};

const STORAGE_KEY = "delego_notification_quiet_hours";

export function loadQuietHoursConfig(): QuietHoursConfig {
  if (typeof window === "undefined") return DEFAULT_QUIET_HOURS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_QUIET_HOURS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_QUIET_HOURS,
      ...parsed,
    };
  } catch {
    return DEFAULT_QUIET_HOURS;
  }
}

export function saveQuietHoursConfig(config: QuietHoursConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Checks whether quiet hours are currently active based on config and local/Intl time.
 * Correctly handles overnight windows (e.g. 22:00 to 07:00) and day-of-week masks.
 */
export function isQuietHoursActive(
  nowInput: Date | number = Date.now(),
  config: QuietHoursConfig = DEFAULT_QUIET_HOURS,
  timeZone?: string
): boolean {
  if (!config.enabled) return false;

  const dateObj = typeof nowInput === "number" ? new Date(nowInput) : nowInput;
  const tz = timeZone || config.timeZone;

  let currentHour: number;
  let currentMinute: number;
  let currentDay: number;

  if (tz) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        weekday: "short",
        hour12: false,
      });
      const parts = formatter.formatToParts(dateObj);
      let hourStr = "0";
      let minStr = "0";
      let dayStr = "Sun";
      for (const part of parts) {
        if (part.type === "hour") hourStr = part.value;
        if (part.type === "minute") minStr = part.value;
        if (part.type === "weekday") dayStr = part.value;
      }
      currentHour = parseInt(hourStr, 10) % 24;
      currentMinute = parseInt(minStr, 10);
      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      currentDay = dayMap[dayStr] ?? dateObj.getDay();
    } catch {
      currentHour = dateObj.getHours();
      currentMinute = dateObj.getMinutes();
      currentDay = dateObj.getDay();
    }
  } else {
    currentHour = dateObj.getHours();
    currentMinute = dateObj.getMinutes();
    currentDay = dateObj.getDay();
  }

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = parseTimeToMinutes(config.startTime);
  const endMinutes = parseTimeToMinutes(config.endTime);

  // Check if current day of week is enabled
  const dayMatch = config.daysOfWeek.includes(currentDay);

  if (startMinutes === endMinutes) {
    // 24-hour quiet hours
    return dayMatch;
  }

  if (startMinutes < endMinutes) {
    // Same-day window (e.g. 09:00 to 17:00)
    return (
      dayMatch && currentMinutes >= startMinutes && currentMinutes < endMinutes
    );
  } else {
    // Overnight window (e.g. 22:00 to 07:00 next day)
    // If current time is >= 22:00 (today) OR < 07:00 (morning after start day)
    if (currentMinutes >= startMinutes) {
      return dayMatch;
    }
    if (currentMinutes < endMinutes) {
      // Overnight portion belongs to previous day's mask
      const prevDay = (currentDay + 6) % 7;
      return config.daysOfWeek.includes(prevDay);
    }
    return false;
  }
}

/**
 * Determines whether a notification should be muted during quiet hours.
 */
export function shouldMuteForQuietHours(
  notification: {
    type?: string;
    severity?: "routine" | "approval";
    title?: string;
  },
  config: QuietHoursConfig,
  now: Date | number = Date.now()
): boolean {
  if (!isQuietHoursActive(now, config)) return false;

  const isApprovalOrUrgent =
    notification.severity === "approval" ||
    notification.type === "error" ||
    (notification.title &&
      /approval|urgent|require|action/i.test(notification.title));

  if (config.bypassApprovals && isApprovalOrUrgent) {
    return false; // Pierces quiet hours
  }

  return true; // Suppressed / muted
}
