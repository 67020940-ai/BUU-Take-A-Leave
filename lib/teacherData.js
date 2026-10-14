import { prisma } from './prisma.js';
import { listCoursesForTeacher, listStudentsInCourse, getAttendanceSummary, listLeavesForTeacher, getCourse, getUserById } from './db.js';
import { getMockCoursesForTeacher, buildMockRoster, MOCK_COURSES } from './mockTeacherData.js';

function enrichCourse(course) {
  let acronym = course.acronym;
  let shortName = course.shortName;
  if (!acronym) {
    const code = course.code || '';
    const name = course.name || '';
    if (code.includes('24527664') || name.includes('วิเคราะห์และออกแบบ') || name.includes('Systems Analysis')) acronym = 'SA';
    else if (code.includes('24527564') || name.includes('โอเพนซอร์ส') || name.includes('Open Source')) acronym = 'OSS';
    else if (code.includes('24510164') || name.includes('สารสนเทศเบื้องต้น') || name.includes('Office')) acronym = 'OA';
    else if (code.length >= 6) acronym = code.slice(3, 6);
    else acronym = code.slice(-3) || 'SUB';
  }
  if (!shortName) {
    const name = course.name || '';
    if (name.includes('วิเคราะห์และออกแบบ')) shortName = 'ซอฟต์แวร์';
    else if (name.includes('โอเพนซอร์ส')) shortName = 'โอเพ่นซอร์ส';
    else if (name.includes('สารสนเทศเบื้องต้น')) shortName = 'สารสนเทศเบื้องต้น';
    else if (name.includes('ฐานข้อมูล')) shortName = 'ฐานข้อมูล';
    else shortName = name.split(' ')[0] || course.code;
  }
  return { ...course, acronym, shortName };
}

// รวม logic ดึงรายวิชา + สรุปเวลาเรียนของอาจารย์ไว้ที่เดียว ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลัก,
// หน้าพิมพ์รายงาน และ export CSV เพื่อให้ทั้ง 3 จุดตกลงกันเสมอว่าตอนนี้ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง (mock)
export async function getTeacherCoursesAndRoster(teacherId) {
  const teacherUser = await getUserById(teacherId);
  const realCourses = await listCoursesForTeacher(teacherId);
  let usingMock = realCourses.length === 0;
  const mockFallback = getMockCoursesForTeacher(teacherUser?.email || teacherId);
  let courses = (usingMock ? mockFallback : realCourses).map(enrichCourse);

  const rosterByCourse = {};
  if (usingMock) {
    for (const course of courses) rosterByCourse[course.id] = buildMockRoster(course);
  } else {
    const courseIds = courses.map((c) => c.id);
    const [allEnrollments, allApprovedLeaves] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        include: { student: true },
      }),
      prisma.leaveRequest.groupBy({
        by: ['studentId', 'courseId'],
        where: {
          courseId: { in: courseIds },
          status: 'อนุมัติ',
        },
        _count: { _all: true },
      }),
    ]);

    const leaveCountMap = new Map();
    for (const row of allApprovedLeaves) {
      leaveCountMap.set(`${row.studentId}_${row.courseId}`, row._count._all);
    }

    const courseMap = new Map(courses.map((c) => [c.id, c]));
    for (const course of courses) {
      rosterByCourse[course.id] = [];
    }

    for (const enroll of allEnrollments) {
      const course = courseMap.get(enroll.courseId);
      if (!course) continue;
      const s = enroll.student;
      const approvedLeaves = leaveCountMap.get(`${s.id}_${course.id}`) || 0;
      const totalSessions = course.totalSessions || 15;
      const attended = Math.max(totalSessions - approvedLeaves, 0);
      const percentage = Math.round((attended / totalSessions) * 100);
      const quotaLimit = Math.floor(totalSessions * 0.2);

      rosterByCourse[course.id].push({
        studentId: s.id,
        studentCode: s.studentId || '-',
        studentName: s.name,
        email: s.email,
        attended,
        totalSessions,
        approvedLeaves,
        quotaLimit,
        percentage,
        overQuota: approvedLeaves > quotaLimit,
      });
    }
    // Fallback: เฉพาะกรณี teacher-mock เท่านั้นที่สลับไปใช้ MOCK_COURSES
    const totalStudents = Object.values(rosterByCourse).reduce((sum, r) => sum + r.length, 0);
    if (totalStudents === 0 && teacherId === 'teacher-mock') {
      console.warn('[teacherData] Mock teacher empty roster — falling back to mock data');
      usingMock = true;
      courses = (mockFallback.length > 0 ? mockFallback : MOCK_COURSES).map(enrichCourse);
      for (const course of courses) rosterByCourse[course.id] = buildMockRoster(course);
      for (const rc of realCourses) {
        if (rosterByCourse[rc.id] && rosterByCourse[rc.id].length === 0) {
          delete rosterByCourse[rc.id];
        }
      }
    }
  }
  return { usingMock, courses, rosterByCourse };
}

// leaves (ทุกสถานะ) ของอาจารย์คนนี้ — ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลักและหน้าประวัติการอนุมัติ
export async function getTeacherLeaves(teacherId, usingMock) {
  if (usingMock) {
    return [];
  }
  const rawLeaves = await listLeavesForTeacher(teacherId);
  return Promise.all(
    rawLeaves.map(async (l) => {
      const [course, student] = await Promise.all([getCourse(l.courseId), getUserById(l.studentId)]);
      return {
        ...l,
        courseCode: course?.code || '-',
        courseName: course?.name || '-',
        courseTerm: course?.term || '-',
        section: course?.group || '',
        studentName: student?.name || '-',
        studentCode: student?.studentId || '-',
        studentEmail: student?.email || '',
      };
    })
  );
}
