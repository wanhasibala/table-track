import { describe, it, expect } from "vitest";
import {
  crc16,
  parseTLV,
  serializeTLV,
  validateQris,
  toDynamicQris,
  generateQrisQrCodeDataUrl,
} from "./qris";

describe("QRIS Utility Module", () => {
  // A standard valid static QRIS payload
  // Structure:
  // 00 02 01 (Format: 01)
  // 01 02 11 (Static QR: 11)
  // 26 40 0014ID.LINKAJA.WWW0118936000000000000000 (Merchant info)
  // 52 04 5812 (Merchant category)
  // 53 03 360  (Currency: IDR)
  // 58 02 ID   (Country: ID)
  // 59 13 KOPI KENANGAN (Merchant Name)
  // 60 07 JAKARTA (City)
  // 63 04 [CRC]
  const basePayloadWithoutCrc =
    "00020101021126400014ID.LINKAJA.WWW01189360000000000000005204581253033605802ID5913KOPI KENANGAN6007JAKARTA6304";
  const validCrc = crc16(basePayloadWithoutCrc);
  const sampleStaticQris = `${basePayloadWithoutCrc}${validCrc}`;

  it("should calculate CRC-16 correctly and match checksum", () => {
    const calculated = crc16(basePayloadWithoutCrc);
    expect(calculated).toHaveLength(4);
    expect(sampleStaticQris.endsWith(calculated)).toBe(true);
  });

  it("should parse TLV correctly into tag, length, and value", () => {
    const tlvs = parseTLV(sampleStaticQris);
    expect(tlvs.length).toBeGreaterThan(5);

    const tag00 = tlvs.find((t) => t.tag === "00");
    expect(tag00).toEqual({ tag: "00", length: 2, value: "01" });

    const tag01 = tlvs.find((t) => t.tag === "01");
    expect(tag01).toEqual({ tag: "01", length: 2, value: "11" });

    const tag59 = tlvs.find((t) => t.tag === "59");
    expect(tag59?.value).toBe("KOPI KENANGAN");

    const tag63 = tlvs[tlvs.length - 1];
    expect(tag63.tag).toBe("63");
    expect(tag63.value).toBe(validCrc);
  });

  it("should serialize TLVs back to original raw string", () => {
    const tlvs = parseTLV(sampleStaticQris);
    const serialized = serializeTLV(tlvs);
    expect(serialized).toBe(sampleStaticQris);
  });

  it("should validate a valid QRIS payload successfully", () => {
    const result = validateQris(sampleStaticQris);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.tlvs).toBeDefined();
  });

  it("should reject QRIS with corrupted CRC or invalid tag 00", () => {
    // Corrupted CRC
    const corruptedCrc = sampleStaticQris.slice(0, -4) + "0000";
    const resultCrc = validateQris(corruptedCrc);
    expect(resultCrc.valid).toBe(false);
    expect(resultCrc.error).toContain("CRC checksum mismatch");

    // Invalid Tag 00
    const invalidTag00 = "000299" + sampleStaticQris.slice(6);
    const resultTag00 = validateQris(invalidTag00);
    expect(resultTag00.valid).toBe(false);
  });

  it("should convert static QRIS to dynamic QRIS with embedded amount", () => {
    const amount = 15000;
    const dynamicQris = toDynamicQris(sampleStaticQris, amount);

    // Must contain dynamic indicator 010212
    expect(dynamicQris).toContain("010212");

    // Must not contain static indicator 010211
    expect(dynamicQris).not.toContain("010211");

    // Must contain tag 54 for nominal 15000 -> 540515000
    expect(dynamicQris).toContain("540515000");

    // Re-validation of dynamic QRIS must pass
    const validation = validateQris(dynamicQris);
    expect(validation.valid).toBe(true);

    // CRC of dynamic QRIS must match its new recalculation
    const dynamicBase = dynamicQris.slice(0, -4);
    const dynamicExpectedCrc = crc16(dynamicBase);
    expect(dynamicQris.endsWith(dynamicExpectedCrc)).toBe(true);
  });

  it("should handle larger amounts and floating points properly rounded", () => {
    const dynamicQris = toDynamicQris(sampleStaticQris, 275500.4);
    expect(dynamicQris).toContain("5406275500");

    const validation = validateQris(dynamicQris);
    expect(validation.valid).toBe(true);
  });

  it("should reject non-positive amounts", () => {
    expect(() => toDynamicQris(sampleStaticQris, 0)).toThrow();
    expect(() => toDynamicQris(sampleStaticQris, -5000)).toThrow();
  });

  it("should generate Data URL QR code without error", async () => {
    const dynamicQris = toDynamicQris(sampleStaticQris, 25000);
    const dataUrl = await generateQrisQrCodeDataUrl(dynamicQris);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
