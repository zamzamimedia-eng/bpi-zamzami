import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke landing page, auth, dan api routes
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') || 
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // file static
  ) {
    return NextResponse.next();
  }

  // Cek cookie auth_token
  const authToken = request.cookies.get('auth_token');

  if (!authToken) {
    // Redirect ke halaman login jika belum auth
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Tentukan rute yang diproteksi
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
