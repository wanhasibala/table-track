/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";
import "dayjs/locale/id";

export interface ParsedSchedule {
  isScheduled: boolean;
  scheduledDate: Date | null;
  scheduledDateStr: string | null; // YYYY-MM-DD
  scheduledTimeStr: string | null; // HH:mm
  formattedSchedule: string | null;
  isToday: boolean;
  isFutureDay: boolean;
  isPast: boolean;
}

const SCHEDULE_REGEX = /\[SCHEDULED:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})(?:\s+([0-9]{1,2}:[0-9]{2}))?\]/i;

/**
 * Creates the standardized note tag for scheduled orders.
 * Example: [SCHEDULED: 2026-09-10 14:30]
 */
export function createScheduleNoteTag(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  return `[SCHEDULED: ${cleanDate}${cleanTime ? ` ${cleanTime}` : ""}]`;
}

/**
 * Strips the [SCHEDULED: ...] prefix from notes for clean customer/kitchen display.
 */
export function cleanOrderNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  return notes.replace(SCHEDULE_REGEX, "").trim();
}

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:mm) into an ISO string.
 */
export function combineDateAndTimeToIso(dateStr: string, timeStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const time = timeStr && timeStr.trim() ? timeStr.trim() : "12:00";
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(dateStr);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d.toISOString();
}

/**
 * Extracts and parses schedule details from an order object, checking both
 * the `scheduled_for` column (if present) and the `notes` string for fallback.
 */
export function parseOrderSchedule(
  order: { scheduled_for?: string | null; notes?: string | null } | null | undefined
): ParsedSchedule {
  const result: ParsedSchedule = {
    isScheduled: false,
    scheduledDate: null,
    scheduledDateStr: null,
    scheduledTimeStr: null,
    formattedSchedule: null,
    isToday: false,
    isFutureDay: false,
    isPast: false,
  };

  if (!order) return result;

  let targetDate: Date | null = null;
  let dateStr: string | null = null;
  let timeStr: string | null = null;

  // 1. First priority: direct column scheduled_for
  if ((order as any).scheduled_for) {
    const parsed = new Date((order as any).scheduled_for);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
      const d = dayjs(parsed);
      dateStr = d.format("YYYY-MM-DD");
      timeStr = d.format("HH:mm");
    }
  }

  // 2. Second priority / fallback: parsed from notes
  if (!targetDate && order.notes) {
    const match = order.notes.match(SCHEDULE_REGEX);
    if (match) {
      dateStr = match[1];
      timeStr = match[2] || "12:00";
      const [hours, minutes] = timeStr.split(":").map(Number);
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(hours || 0, minutes || 0, 0, 0);
        targetDate = parsed;
      }
    }
  }

  if (targetDate && !isNaN(targetDate.getTime())) {
    const now = dayjs();
    const scheduleDay = dayjs(targetDate);

    const isToday = scheduleDay.isSame(now, "day");
    const isTomorrow = scheduleDay.isSame(now.add(1, "day"), "day");
    const isFutureDay = scheduleDay.isAfter(now, "day");
    const isPast = scheduleDay.isBefore(now, "minute");

    let formatted = "";
    const timeDisplay = timeStr || scheduleDay.format("HH:mm");

    if (isToday) {
      formatted = `Today • ${timeDisplay}`;
    } else if (isTomorrow) {
      formatted = `Tomorrow • ${timeDisplay}`;
    } else {
      // e.g. "Kamis, 10 Sep 2026 • 14:30"
      formatted = `${scheduleDay.locale("id").format("ddd, D MMM YYYY")} • ${timeDisplay}`;
    }

    return {
      isScheduled: true,
      scheduledDate: targetDate,
      scheduledDateStr: dateStr,
      scheduledTimeStr: timeStr,
      formattedSchedule: formatted,
      isToday,
      isFutureDay,
      isPast,
    };
  }

  return result;
}
