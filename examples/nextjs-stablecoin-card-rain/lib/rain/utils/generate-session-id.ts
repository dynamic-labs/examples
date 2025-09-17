import { RAIN_RSA_PUBLIC_PEM } from "@/lib/rain/utils/rain-public-key";

export async function generateSessionId(secret?: string) {
  if (!RAIN_RSA_PUBLIC_PEM) throw new Error("pem is required");
  if (secret && !/^[0-9A-Fa-f]+$/.test(secret)) {
    throw new Error("secret must be a hex string");
  }

  const secretKey = secret ?? window.crypto.randomUUID().replace(/-/g, "");
  const hbytes = [];
  for (let i = 0; i < secretKey.length; i += 2) {
    hbytes.push(parseInt(secretKey.substr(i, 2), 16));
  }
  const byteArray = new Uint8Array(hbytes);
  let hbinary = "";
  byteArray.forEach((byte) => (hbinary += String.fromCharCode(byte)));
  const secretKeyBase64 = window.btoa(hbinary);

  // fetch the part of the PEM string between header and footer
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = RAIN_RSA_PUBLIC_PEM.substring(
    pemHeader.length,
    RAIN_RSA_PUBLIC_PEM.length - pemFooter.length - 1
  );
  // base64 decode the string to get the binary data
  const binaryDerString = window.atob(pemContents);
  // convert from a binary string to an ArrayBuffer
  const buf = new ArrayBuffer(binaryDerString.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = binaryDerString.length; i < strLen; i++) {
    bufView[i] = binaryDerString.charCodeAt(i);
  }
  const binaryDer = buf;

  const rsaPublicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-1" },
    true,
    ["encrypt"]
  );

  const encryptedArrayBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    new TextEncoder().encode(secretKeyBase64)
  );
  let binary = "";
  const bytes = new Uint8Array(encryptedArrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);

  const sessionId = window.btoa(binary);

  return {
    secretKey,
    sessionId,
  };
}
