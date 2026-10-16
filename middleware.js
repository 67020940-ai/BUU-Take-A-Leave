import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get('session')?.value;
  const token = rawToken ? decodeURIComponent(rawToken) : null;

  const isStudentRoute = pathname.startsWith('/student');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isStudentRoute || isTeacherRoute || isAdminRoute) {
    const fullCallbackPath = `${pathname}${request.nextUrl.search}`;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', fullCallbackPath);
      return NextResponse.redirect(loginUrl);
    }

    // Token format: `${userId}:${role}.${sig}` or legacy `${userId}.${sig}`
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', fullCallbackPath);
      return NextResponse.redirect(loginUrl);
    }

    const payload = token.slice(0, dotIndex);
    let role = 'student';
    let userId = payload;

    if (payload.includes(':')) {
      const parts = payload.split(':');
      userId = parts[0];
      role = parts[1];
    } else {
      if (userId.startsWith('admin') || userId === 'admin-mock') role = 'admin';
      else if (userId.startsWith('teacher') || userId === 'teacher-mock') role = 'teacher';
      else role = 'student';
    }

    // Strict Role-Based Access Control (RBAC)
    if (role === 'student' && (isTeacherRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/student', request.url));
    }
    if (role === 'teacher' && (isStudentRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/teacher', request.url));
    }
    if (role === 'admin' && isStudentRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
