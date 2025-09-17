export async function decryptSecret(
  base64Secret: string,
  base64Iv: string,
  secretKey: string
) {
  if (!base64Secret) throw new Error("base64Secret is required");
  if (!base64Iv) throw new Error("base64Iv is required");
  if (!secretKey || !/^[0-9A-Fa-f]+$/.test(secretKey)) {
    throw new Error("secretKey must be a hex string");
  }

  const secret = Uint8Array.from(window.atob(base64Secret), (c) =>
    c.charCodeAt(0)
  );
  const iv = Uint8Array.from(window.atob(base64Iv), (c) => c.charCodeAt(0));
  const secretKeyArrayBuffer = Uint8Array.from(
    secretKey.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    secretKeyArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    secret
  );

  return new TextDecoder().decode(decrypted);
}
