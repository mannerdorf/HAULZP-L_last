import { getSessionCookieName } from '@/lib/auth';

export async function POST() {
  const res = Response.json({ ok: true });
  res.cookies.set(getSessionCookieName(), '', { path: '/', maxAge: 0 });
  return res;
}
