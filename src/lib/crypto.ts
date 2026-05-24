// Browser-side zero-knowledge encryption using WebCrypto AES-GCM.

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str: string) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as unknown as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 250_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function randomKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export interface EncryptResult {
  ciphertext: string; // base64url
  iv: string;         // base64url
  keyFragment: string | null; // 6-7 digit code (null when password-protected)
  salt: string | null; // base64url, only when password-protected
}

export async function encryptText(plaintext: string, password?: string): Promise<EncryptResult> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let key: CryptoKey;
  let salt: Uint8Array | null = null;
  let keyFragment: string | null = null;

  if (password && password.length > 0) {
    salt = crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKeyFromPassword(password, salt);
  } else {
    key = await randomKey();
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
    // Generate 6-7 digit code from key
    const keyHash = Array.from(raw.slice(0, 4))
      .reduce((acc, byte) => acc + byte, 0);
    keyFragment = String(keyHash % 10000000).padStart(7, '0');
    // Store full key in keyFragment for now (we'll use the code for verification)
    keyFragment = b64url(raw) + ':' + keyFragment;
  }

  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      new TextEncoder().encode(plaintext) as unknown as BufferSource,
    ),
  );

  return {
    ciphertext: b64url(ct),
    iv: b64url(iv),
    keyFragment,
    salt: salt ? b64url(salt) : null,
  };
}

export async function decryptText(opts: {
  ciphertext: string;
  iv: string;
  keyFragment?: string | null;
  salt?: string | null;
  password?: string;
  userKey?: string; // 6-7 digit code entered by user
}): Promise<string> {
  const iv = fromB64url(opts.iv);
  const ct = fromB64url(opts.ciphertext);

  let key: CryptoKey;
  if (opts.salt) {
    if (!opts.password) throw new Error("password-required");
    key = await deriveKeyFromPassword(opts.password, fromB64url(opts.salt));
  } else {
    if (!opts.keyFragment) throw new Error("missing-key");
    
    // Check if keyFragment contains verification code
    if (opts.keyFragment.includes(':')) {
      // Extract full key and verification code
      const [fullKey, verificationCode] = opts.keyFragment.split(':');
      
      // Verify user entered correct code (if userKey is provided)
      if (opts.userKey) {
        if (opts.userKey !== verificationCode) {
          throw new Error("invalid-key-code");
        }
      } else {
        // No userKey provided, but we need it
        throw new Error("key-code-required");
      }
      
      key = await crypto.subtle.importKey(
        "raw",
        fromB64url(fullKey) as unknown as BufferSource,
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
    } else {
      // Old format without verification code
      key = await crypto.subtle.importKey(
        "raw",
        fromB64url(opts.keyFragment) as unknown as BufferSource,
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
    }
  }

  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    ct as unknown as BufferSource,
  );
  return new TextDecoder().decode(pt);
}

export function randomId(len = 14) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return b64url(bytes);
}
