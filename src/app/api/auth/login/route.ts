import { NextRequest, NextResponse } from 'next/server';
import { signSession, getSessionCookieName, getSessionCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const email = process.env.AUTH_EMAIL?.trim();
  const password = process.env.AUTH_PASSWORD;

  if (!email || !password) {
    return NextResponse.json({
      error: 'Задайте AUTH_EMAIL, AUTH_PASSWORD и AUTH_SECRET в настройках (Vercel → Environment Variables или локально в .env)',
    }, { status: 500 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный запрос' }, { status: 400 });
  }

  const inputEmail = String(body.email ?? '').trim().toLowerCase();
  const inputPassword = body.password ?? '';

  if (inputEmail !== email.toLowerCase() || inputPassword !== password) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const token = signSession(inputEmail);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());
  return res;
}
