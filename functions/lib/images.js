import { HttpError } from './security.js';

export const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function u16be(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function u24le(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function u32be(bytes, offset) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function pngInfo(bytes) {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 45 || !magic.every((value, index) => bytes[index] === value)) return null;
  if (u32be(bytes, 8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR'
    || String.fromCharCode(...bytes.slice(-8, -4)) !== 'IEND') {
    throw new HttpError(415, 'invalid_image', 'The image file is malformed.');
  }
  return { type: 'image/png', ext: 'png', width: u32be(bytes, 16), height: u32be(bytes, 20) };
}

function jpegInfo(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) return null;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;
    const length = u16be(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (sof.has(marker) && length >= 7) {
      return { type: 'image/jpeg', ext: 'jpg', width: u16be(bytes, offset + 5), height: u16be(bytes, offset + 3) };
    }
    offset += length;
  }
  throw new HttpError(415, 'invalid_image', 'The JPEG image has no valid dimensions.');
}

function webpInfo(bytes) {
  if (bytes.length < 30 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') return null;
  const declaredSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] * 0x1000000);
  if (declaredSize + 8 !== bytes.length) throw new HttpError(415, 'invalid_image', 'The image file is malformed.');
  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === 'VP8X') {
    return { type: 'image/webp', ext: 'webp', width: 1 + u24le(bytes, 24), height: 1 + u24le(bytes, 27) };
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
    return { type: 'image/webp', ext: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { type: 'image/webp', ext: 'webp', width: u16be(Uint8Array.of(bytes[27], bytes[26]), 0) & 0x3fff, height: u16be(Uint8Array.of(bytes[29], bytes[28]), 0) & 0x3fff };
  }
  throw new HttpError(415, 'invalid_image', 'The WebP image has no valid dimensions.');
}

export function inspectImage(bytes, limits = {}) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    throw new HttpError(400, 'image_required', 'An image is required.');
  }
  if (bytes.byteLength > limits.maxBytes) throw new HttpError(413, 'image_too_large', 'The image is too large.');
  const info = pngInfo(bytes) || jpegInfo(bytes) || webpInfo(bytes);
  if (!info) throw new HttpError(415, 'unsupported_image', 'Only valid JPEG, PNG, and WebP images are supported.');
  if (!Number.isSafeInteger(info.width) || !Number.isSafeInteger(info.height) || info.width < 1 || info.height < 1
    || info.width > limits.maxDimension || info.height > limits.maxDimension
    || info.width * info.height > limits.maxPixels) {
    throw new HttpError(422, 'invalid_image_dimensions', 'The image dimensions exceed the allowed limits.');
  }
  return info;
}

export function decodeBase64Image(value, maxBytes) {
  if (typeof value !== 'string') throw new HttpError(400, 'invalid_image', 'Image must be base64 encoded.');
  const match = /^(?:data:([^;,]+);base64,)?([A-Za-z0-9+/]*={0,2})$/.exec(value.trim());
  if (!match || match[2].length % 4 === 1) throw new HttpError(400, 'invalid_image', 'Image must be valid base64.');
  const estimated = Math.floor(match[2].length * 3 / 4) - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  if (estimated > maxBytes) throw new HttpError(413, 'image_too_large', 'The image is too large.');
  let bytes;
  try {
    bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  } catch {
    throw new HttpError(400, 'invalid_image', 'Image must be valid base64.');
  }
  return { bytes, declaredType: match[1]?.toLowerCase() || null };
}
