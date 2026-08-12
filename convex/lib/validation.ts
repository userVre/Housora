const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export function boundedString(
  value: string,
  field: string,
  minLength: number,
  maxLength: number,
): string {
  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new Error(`${field} must be between ${minLength} and ${maxLength} characters`);
  }
  return normalized;
}

export function optionalBoundedString(
  value: string | undefined,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined) return undefined;
  return boundedString(value, field, 1, maxLength);
}

export function boundedEmail(value: string): string {
  const email = boundedString(value, "email", 3, 320).toLowerCase();
  if (!email.includes("@")) throw new Error("email is invalid");
  return email;
}

export function optionalHttpUrl(
  value: string | undefined,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  const normalized = boundedString(value, field, 1, 4096);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${field} must use http or https`);
  }
  return normalized;
}

export function finiteNumberInRange(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}`);
  }
  return value;
}

export function positiveSafeInteger(
  value: number,
  field: string,
  maximum: number,
): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${field} must be a positive integer no greater than ${maximum}`);
  }
  return value;
}
