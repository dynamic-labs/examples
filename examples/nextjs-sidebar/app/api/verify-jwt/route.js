import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

const client = new JwksClient({
  jwksUri: `https://app.dynamic.xyz/api/v0/sdk/${process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID}/.well-known/jwks`
});

export async function POST(request) {
  const { token } = await request.json();

  try {
    const signingKey = await client.getSigningKey();
    const publicKey = signingKey.getPublicKey();
    const decoded = jwt.verify(token, publicKey);
    return new Response(JSON.stringify({ decoded }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return new Response(JSON.stringify({ error: 'Invalid token', details: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}