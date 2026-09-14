import { listCoursesForTeacher, listStudentsInCourse, getAttendanceSummary, listLeavesForTeacher, getCourse, getUserById } from './db';
import { MOCK_COURSES, buildMockRoster, buildMockPendingLeaves, buildMockLeaveHistory } from './mockTeacherData';

// รวม logic ดึงรายวิชา + สรุปเวลาเรียนของอาจารย์ไว้ที่เดียว ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลัก,
// หน้าพิมพ์รายงาน และ export CSV เพื่อให้ทั้ง 3 จุดตกลงกันเสมอว่าตอนนี้ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง (mock)
export async function getTeacherCoursesAndRoster(teacherId) {
  const realCourses = await listCoursesForTeacher(teacherId);
  const usingMock = realCourses.length === 0;
  const courses = usingMock ? MOCK_COURSES : realCourses;

  const rosterByCourse = {};
  if (usingMock) {
    for (const course of courses) rosterByCourse[course.id] = buildMockRoster(course);
  } else {
    for (const course of courses) {
      const students = await listStudentsInCourse(course.id);
      rosterByCourse[course.id] = await Promise.all(
        students.map(async (s) => {
          const summary = await getAttendanceSummary(s.id, course.id);
          return {
            studentId: s.id,
            studentCode: s.studentId || '-',
            studentName: s.name,
            email: s.email,
            attended: summary.attended,
            totalSessions: summary.totalSessions,
            approvedLeaves: summary.approvedLeaves,
            quotaLimit: summary.quotaLimit,
            percentage: summary.percentage,
            overQuota: summary.overQuota,
          };
        })
      );
    }
  }
  return { usingMock, courses, rosterByCourse };
}

// leaves (ทุกสถานะ) ของอาจารย์คนนี้ — ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลักและหน้าประวัติการอนุมัติ
export async function getTeacherLeaves(teacherId, usingMock) {
  if (usingMock) {
    return [...buildMockPendingLeaves(), ...buildMockLeaveHistory()];
  }
  const rawLeaves = await listLeavesForTeacher(teacherId);
  return Promise.all(
    rawLeaves.map(async (l) => {
      const [course, student] = await Promise.all([getCourse(l.courseId), getUserById(l.studentId)]);
      return {
        ...l,
        courseCode: course?.code || '-',
        courseName: course?.name || '-',
        section: course?.group || '',
        studentName: student?.name || '-',
        studentCode: student?.studentId || '-',
        studentEmail: student?.email || '',
      };
    })
  );
}
