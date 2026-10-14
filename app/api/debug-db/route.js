import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const student = await prisma.user.findUnique({
      where: { email: '66000001@go.buu.ac.th' },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    const teacher = await prisma.user.findFirst({
      where: { role: 'teacher' },
      include: {
        taughtCourses: true,
      },
    });

    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();
    const totalLeaves = await prisma.leaveRequest.count();

    const passwordMatch1234 = student ? await bcrypt.compare('1234', student.password) : false;

    return NextResponse.json({
      student: {
        id: student?.id,
        email: student?.email,
        name: student?.name,
        role: student?.role,
        studentId: student?.studentId,
        enrollmentsCount: student?.enrollments?.length,
        courses: student?.enrollments?.map((e) => ({
          enrollmentId: e.id,
          courseId: e.course.id,
          code: e.course.code,
          name: e.course.name,
          teacherId: e.course.teacherId,
        })),
      },
      teacher: {
        id: teacher?.id,
        email: teacher?.email,
        name: teacher?.name,
        taughtCoursesCount: teacher?.taughtCourses?.length,
      },
      stats: {
        totalCourses,
        totalEnrollments,
        totalLeaves,
      },
      passwordMatch1234,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
