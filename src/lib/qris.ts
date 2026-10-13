import QRCode from "qrcode";
import jsQR from "jsqr";

export interface TLV {
  tag: string;
  length: number;
  value: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  tlvs?: TLV[];
}

/**
 * Calculates CRC-16/CCITT-FALSE checksum for EMVCo / QRIS specifications.
 * Polynomial: 0x1021, Init: 0xFFFF, XOR Out: 0x0000
 */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Parses a raw QRIS TLV (Tag-Length-Value) string into an array of TLV objects.
 */
export function parseTLV(raw: string): TLV[] {
  const result: TLV[] = [];
  let i = 0;

  while (i < raw.length) {
    if (i + 4 > raw.length) {
      throw new Error(`Invalid TLV structure: truncated at position ${i}`);
    }

    const tag = raw.substring(i, i + 2);
    const lengthStr = raw.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length < 0) {
      throw new Error(`Invalid length '${lengthStr}' for tag '${tag}' at position ${i}`);
    }

    const valueStart = i + 4;
    const valueEnd = valueStart + length;

    if (valueEnd > raw.length) {
      throw new Error(
        `Value for tag '${tag}' (length ${length}) overflows string (ends at ${valueEnd}, length ${raw.length})`
      );
    }

    const value = raw.substring(valueStart, valueEnd);
    result.push({ tag, length, value });
    i = valueEnd;
  }

  return result;
}

/**
 * Serializes an array of TLV objects back into a raw EMVCo TLV string.
 */
export function serializeTLV(tlvs: TLV[]): string {
  return tlvs
    .map((item) => {
      const lenStr = item.value.length.toString().padStart(2, "0");
      return `${item.tag}${lenStr}${item.value}`;
    })
    .join("");
}

/**
 * Validates a QRIS string against EMVCo & ASPI QRIS standards.
 * Verifies:
 * 1. Tag 00 is present and equals "01" (Payload Format Indicator)
 * 2. Tag 63 is present at the end and has length 4
 * 3. CRC-16 checksum matches the tag 63 value
 */
export function validateQris(raw: string): ValidationResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, error: "QRIS payload is empty or not a string" };
  }

  const trimmed = raw.trim();
  if (trimmed.length < 20) {
    return { valid: false, error: "QRIS payload too short" };
  }

  let tlvs: TLV[];
  try {
    tlvs = parseTLV(trimmed);
  } catch (err: any) {
    return { valid: false, error: `Malformed TLV structure: ${err?.message || err}` };
  }

  // Check Tag 00
  const tag00 = tlvs.find((t) => t.tag === "00");
  if (!tag00 || tag00.value !== "01") {
    return { valid: false, error: "Invalid Payload Format Indicator (Tag 00 must be '01')" };
  }

  // Check Tag 63 (CRC)
  const lastTlv = tlvs[tlvs.length - 1];
  if (!lastTlv || lastTlv.tag !== "63" || lastTlv.length !== 4) {
    return { valid: false, error: "Missing or malformed CRC (Tag 63)" };
  }

  // Verify CRC checksum
  // Data to hash is everything before the 4-char CRC checksum (i.e. up to and including '6304')
  const payloadToVerify = trimmed.substring(0, trimmed.length - 4);
  const expectedCrc = lastTlv.value.toUpperCase();
  const calculatedCrc = crc16(payloadToVerify);

  if (expectedCrc !== calculatedCrc) {
    return {
      valid: false,
      error: `CRC checksum mismatch: expected '${expectedCrc}', calculated '${calculatedCrc}'`,
    };
  }

  return { valid: true, tlvs };
}

/**
 * Converts a static QRIS string to a dynamic QRIS string with an embedded transaction amount.
 * - Changes tag 01 from '11' (static) to '12' (dynamic)
 * - Inserts/Updates tag 54 (Transaction Amount)
 * - Recalculates tag 63 (CRC-16)
 */
export function toDynamicQris(staticQris: string, amount: number): string {
  if (!amount || amount <= 0) {
    throw new Error("Transaction amount must be greater than 0");
  }

  const validation = validateQris(staticQris);
  if (!validation.valid || !validation.tlvs) {
    throw new Error(`Invalid static QRIS: ${validation.error}`);
  }

  // Clean formatted amount: Indonesian QRIS standard uses integer string for IDR
  const formattedAmount = Math.round(amount).toString();

  // Clone TLVs excluding tag 63
  const tlvs = validation.tlvs.filter((t) => t.tag !== "63");

  // 1. Update or insert Tag 01 (Point of Initiation Method -> 12 for dynamic)
  const tag01Index = tlvs.findIndex((t) => t.tag === "01");
  if (tag01Index >= 0) {
    tlvs[tag01Index] = { tag: "01", length: 2, value: "12" };
  } else {
    // Insert after Tag 00
    const tag00Index = tlvs.findIndex((t) => t.tag === "00");
    const insertPos = tag00Index >= 0 ? tag00Index + 1 : 0;
    tlvs.splice(insertPos, 0, { tag: "01", length: 2, value: "12" });
  }

  // 2. Update or insert Tag 54 (Transaction Amount)
  const tag54Index = tlvs.findIndex((t) => t.tag === "54");
  const tag54Item: TLV = {
    tag: "54",
    length: formattedAmount.length,
    value: formattedAmount,
  };

  if (tag54Index >= 0) {
    tlvs[tag54Index] = tag54Item;
  } else {
    // Standard tag positioning: after tag 53 (Currency Code) if present, or before tag 58 (Country Code)
    const tag53Index = tlvs.findIndex((t) => t.tag === "53");
    const tag58Index = tlvs.findIndex((t) => t.tag === "58");

    if (tag53Index >= 0) {
      tlvs.splice(tag53Index + 1, 0, tag54Item);
    } else if (tag58Index >= 0) {
      tlvs.splice(tag58Index, 0, tag54Item);
    } else {
      tlvs.push(tag54Item);
    }
  }

  // 3. Serialize payload without Tag 63, append "6304", and compute CRC
  const serialized = serializeTLV(tlvs);
  const dataForCrc = `${serialized}6304`;
  const checksum = crc16(dataForCrc);

  return `${dataForCrc}${checksum}`;
}

/**
 * Generates a base64 Data URL (image/png) for a QRIS payload.
 */
export async function generateQrisQrCodeDataUrl(
  payload: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    ...options,
  });
}

/**
 * Generates an SVG string for a QRIS payload.
 */
export async function generateQrisQrCodeSvg(
  payload: string,
  options?: QRCode.QRCodeToStringOptions
): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    ...options,
  });
}

/**
 * Decodes a QR code string from raw ImageData pixels (RGBA buffer).
 * Useful for scanning client-side or server-side QR image uploads.
 */
export function decodeQrisFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  const code = jsQR(data, width, height);
  if (code && code.data) {
    return code.data;
  }
  return null;
}
