import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  const isStudentRoute = pathname.startsWith('/student');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isStudentRoute || isTeacherRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fast check by signed token prefix: format is `${userId}.${sig}`
    const userId = token.split('.')[0];
    if (userId === 'student-mock' && (isTeacherRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/student', request.url));
    }
    if (userId === 'teacher-mock' && (isStudentRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/teacher', request.url));
    }
    if (userId === 'admin-mock' && isStudentRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
