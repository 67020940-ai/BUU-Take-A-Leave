import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listCoursesForStudent, listCoursesForTeacher, listAllCourses } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });

  let courses;
  if (user.role === 'student') courses = await listCoursesForStudent(user.id);
  else if (user.role === 'teacher') courses = await listCoursesForTeacher(user.id);
  else courses = await listAllCourses();

  return NextResponse.json({ courses });
}
