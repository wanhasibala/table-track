import { describe, it, expect } from "vitest";
import {
  parseOrderSchedule,
  getOrderEffectiveDate,
  isOrderInDateRange,
  isOrderEffectiveToday,
  createScheduleNoteTag,
  cleanOrderNotes,
} from "./order-schedule";

describe("Order Schedule Utilities", () => {
  it("should create and clean schedule note tags properly", () => {
    const tag = createScheduleNoteTag("2026-10-25", "14:30");
    expect(tag).toBe("[SCHEDULED: 2026-10-25 14:30]");

    const rawNote = `${tag} Please don't add spicy chili`;
    const cleaned = cleanOrderNotes(rawNote);
    expect(cleaned).toBe("Please don't add spicy chili");
  });

  it("should parse schedule from scheduled_for direct column", () => {
    const order = {
      scheduled_for: "2026-11-15T10:00:00.000Z",
      notes: "Some notes",
      created_at: "2026-10-01T08:00:00.000Z",
    };

    const schedule = parseOrderSchedule(order);
    expect(schedule.isScheduled).toBe(true);
    expect(schedule.scheduledDate).toBeInstanceOf(Date);
    expect(schedule.scheduledDateStr).toBe("2026-11-15");
  });

  it("should parse schedule from notes fallback when scheduled_for is absent", () => {
    const order = {
      scheduled_for: null,
      notes: "[SCHEDULED: 2026-12-25 18:00] Christmas dinner table reservation",
      created_at: "2026-10-01T08:00:00.000Z",
    };

    const schedule = parseOrderSchedule(order);
    expect(schedule.isScheduled).toBe(true);
    expect(schedule.scheduledDateStr).toBe("2026-12-25");
    expect(schedule.scheduledTimeStr).toBe("18:00");
  });

  it("should return false for orders without schedule", () => {
    const order = {
      scheduled_for: null,
      notes: "Normal dine in order",
      created_at: "2026-10-01T08:00:00.000Z",
    };

    const schedule = parseOrderSchedule(order);
    expect(schedule.isScheduled).toBe(false);
    expect(schedule.scheduledDate).toBeNull();
  });

  describe("getOrderEffectiveDate", () => {
    it("should use scheduled date when order is scheduled", () => {
      const order = {
        scheduled_for: "2026-11-20T15:30:00.000Z",
        created_at: "2026-10-01T08:00:00.000Z",
      };

      const effective = getOrderEffectiveDate(order);
      expect(effective.getFullYear()).toBe(2026);
      expect(effective.getMonth()).toBe(10); // November (0-indexed: 10)
    });

    it("should use created_at when order is NOT scheduled", () => {
      const order = {
        scheduled_for: null,
        created_at: "2026-10-05T08:00:00.000Z",
      };

      const effective = getOrderEffectiveDate(order);
      expect(effective.toISOString()).toBe(new Date("2026-10-05T08:00:00.000Z").toISOString());
    });
  });

  describe("isOrderInDateRange", () => {
    it("should include an order whose scheduled date is inside range, even if created earlier", () => {
      // Order created in October, but scheduled for November 15
      const order = {
        scheduled_for: "2026-11-15T12:00:00.000Z",
        created_at: "2026-10-01T08:00:00.000Z",
      };

      const inNovember = isOrderInDateRange(
        order,
        "2026-11-01T00:00:00.000Z",
        "2026-11-30T23:59:59.999Z"
      );
      expect(inNovember).toBe(true);

      const inOctober = isOrderInDateRange(
        order,
        "2026-10-01T00:00:00.000Z",
        "2026-10-31T23:59:59.999Z"
      );
      expect(inOctober).toBe(false); // Scheduled for November, so excluded from October!
    });

    it("should correctly handle non-scheduled orders by created_at", () => {
      const order = {
        created_at: "2026-10-15T10:00:00.000Z",
      };

      expect(
        isOrderInDateRange(order, "2026-10-01T00:00:00.000Z", "2026-10-31T23:59:59.999Z")
      ).toBe(true);

      expect(
        isOrderInDateRange(order, "2026-11-01T00:00:00.000Z", "2026-11-30T23:59:59.999Z")
      ).toBe(false);
    });
  });

  describe("isOrderEffectiveToday", () => {
    it("should return true for a regular order placed today", () => {
      const order = {
        created_at: new Date().toISOString(),
      };
      expect(isOrderEffectiveToday(order)).toBe(true);
    });

    it("should return false for a regular order placed yesterday", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000 * 2);
      const order = {
        created_at: yesterday.toISOString(),
      };
      expect(isOrderEffectiveToday(order)).toBe(false);
    });

    it("should return true for an order placed in the past but scheduled for today", () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const order = {
        notes: `[SCHEDULED: ${todayStr} 14:00] Booked 3 days ago`,
        created_at: "2026-09-01T10:00:00.000Z",
      };

      expect(isOrderEffectiveToday(order)).toBe(true);
    });

    it("should return false for an order placed today but scheduled for future days", () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000 * 5);
      const yyyy = future.getFullYear();
      const mm = String(future.getMonth() + 1).padStart(2, "0");
      const dd = String(future.getDate()).padStart(2, "0");
      const futureStr = `${yyyy}-${mm}-${dd}`;

      const order = {
        notes: `[SCHEDULED: ${futureStr} 14:00] Booked for next week`,
        created_at: new Date().toISOString(),
      };

      expect(isOrderEffectiveToday(order)).toBe(false);
    });
  });
});
