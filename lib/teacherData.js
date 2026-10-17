import { prisma } from './prisma.js';
import { listCoursesForTeacher, listStudentsInCourse, getAttendanceSummary, listLeavesForTeacher, getCourse, getUserById, getCachedDbValue, setCachedDbValue } from './db.js';
import { getMockCoursesForTeacher, buildMockRoster, buildMockPendingLeaves, buildMockLeaveHistory, MOCK_COURSES, MOCK_LEAVES_BY_STUDENT } from './mockTeacherData.js';
import { enrichCourseSchedule, getCorrectedCourseName } from './leave-stats.js';

function enrichCourse(course) {
  const base = enrichCourseSchedule ? enrichCourseSchedule(course) : { ...course };
  let acronym = base.acronym;
  let shortName = base.shortName;
  const name = getCorrectedCourseName(base.name || '');
  base.name = name;

  if (!acronym) {
    const code = base.code || '';
    if (code.includes('24527664') || name.includes('วิเคราะห์และออกแบบ') || name.includes('Systems Analysis')) acronym = 'SA';
    else if (code.includes('24527564') || name.includes('โอเพนซอร์ส') || name.includes('Open Source')) acronym = 'OSS';
    else if (code.includes('24510164') || name.includes('สารสนเทศเบื้องต้น') || name.includes('Office')) acronym = 'OA';
    else if (code.length >= 6) acronym = code.slice(3, 6);
    else acronym = code.slice(-3) || 'SUB';
  }
  if (!shortName) {
    if (name.includes('วิเคราะห์และออกแบบ')) shortName = 'ซอฟต์แวร์';
    else if (name.includes('โอเพนซอร์ส')) shortName = 'โอเพ่นซอร์ส';
    else if (name.includes('สารสนเทศเบื้องต้น')) shortName = 'สารสนเทศเบื้องต้น';
    else if (name.includes('ฐานข้อมูล')) shortName = 'ฐานข้อมูล';
    else shortName = name.split(' ')[0] || base.code;
  }
  return { ...base, acronym, shortName };
}

// รวม logic ดึงรายวิชา + สรุปเวลาเรียนของอาจารย์ไว้ที่เดียว ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลัก,
// หน้าพิมพ์รายงาน และ export CSV เพื่อให้ทั้ง 3 จุดตกลงกันเสมอว่าตอนนี้ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง (mock)
export async function getTeacherCoursesAndRoster(teacherId) {
  const cacheKey = `teacher_roster_${teacherId}`;
  const cached = getCachedDbValue(cacheKey);
  if (cached !== undefined) return cached;
  try {
    const teacherUser = await getUserById(teacherId);
    const realCourses = await listCoursesForTeacher(teacherId);
    let usingMock = realCourses.length === 0;
    const mockFallback = getMockCoursesForTeacher(teacherUser?.email || teacherId);
    let courses = (usingMock ? mockFallback : realCourses).map(enrichCourse);

    const rosterByCourse = {};
    if (usingMock) {
      for (const course of courses) rosterByCourse[course.id] = buildMockRoster(course);
    } else {
      try {
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

        const hasAnyDbApproved = allApprovedLeaves.length > 0;
        for (const enroll of allEnrollments) {
          const course = courseMap.get(enroll.courseId);
          if (!course) continue;
          const s = enroll.student;
          const dbApprovedCount = leaveCountMap.get(`${s.id}_${course.id}`) || 0;
          const mockApprovedCount = !hasAnyDbApproved && s.studentId ? (MOCK_LEAVES_BY_STUDENT[s.studentId]?.length || 0) : 0;
          const approvedLeaves = dbApprovedCount > 0 ? dbApprovedCount : mockApprovedCount;
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
            overQuota: approvedLeaves >= quotaLimit,
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
      } catch (dbQueryErr) {
        console.warn('[teacherData] Database query error, gracefully falling back to mock:', dbQueryErr.message);
        usingMock = true;
        courses = (mockFallback.length > 0 ? mockFallback : MOCK_COURSES).map(enrichCourse);
        for (const course of courses) rosterByCourse[course.id] = buildMockRoster(course);
      }
    }
    return setCachedDbValue(cacheKey, { usingMock, courses, rosterByCourse });
  } catch (fatalErr) {
    console.error('[teacherData] Fatal error in getTeacherCoursesAndRoster, falling back to mock:', fatalErr.message);
    const mockCourses = (getMockCoursesForTeacher(teacherId) || MOCK_COURSES).map(enrichCourse);
    const rosterByCourse = {};
    for (const course of mockCourses) rosterByCourse[course.id] = buildMockRoster(course);
    return { usingMock: true, courses: mockCourses, rosterByCourse };
  }
}

// leaves (ทุกสถานะ) ของอาจารย์คนนี้ — ใช้ร่วมกันทั้งหน้าแดชบอร์ดหลักและหน้าประวัติการอนุมัติ
export async function getTeacherLeaves(teacherId, usingMock) {
  const cacheKey = `teacher_leaves_${teacherId}_${Boolean(usingMock)}`;
  const cached = getCachedDbValue(cacheKey);
  if (cached !== undefined) return cached;
  try {
    const teacherUser = await getUserById(teacherId);
    const teacherEmail = teacherUser?.email || (typeof teacherId === 'string' && teacherId.includes('@') ? teacherId : 'teacher-akara@buu.ac.th');
    const mockCourses = getMockCoursesForTeacher(teacherEmail);

    let rawLeaves = [];
    try {
      rawLeaves = await listLeavesForTeacher(teacherId);
    } catch (err) {
      console.warn('getTeacherLeaves error:', err.message);
    }

    let enrichedDbLeaves = [];
    try {
      enrichedDbLeaves = await Promise.all(
        (rawLeaves || []).map(async (l) => {
          const hasCourse = Boolean(l.course || (l.courseCode && l.courseName));
          const hasStudent = Boolean(l.student || (l.studentName && l.studentCode));
          const course = hasCourse ? l.course : await getCourse(l.courseId);
          const student = hasStudent ? l.student : await getUserById(l.studentId);
          return {
            ...l,
            courseCode: course?.code || l.courseCode || '-',
            courseName: course?.name || l.courseName || '-',
            courseTerm: course?.term || l.courseTerm || '-',
            section: course?.group || l.section || '',
            studentName: student?.name || l.studentName || '-',
            studentCode: student?.studentId || l.studentCode || '-',
            studentEmail: student?.email || l.studentEmail || '',
          };
        })
      );
    } catch (enrichErr) {
      console.warn('getTeacherLeaves enrichment error:', enrichErr.message);
    }

    // If using mock mode or if there are no leaves in DB for this teacher, merge mock pending leaves
    if (usingMock || enrichedDbLeaves.length === 0) {
      const mockLeaves = [...buildMockPendingLeaves(mockCourses), ...buildMockLeaveHistory(mockCourses)];
      const existingIds = new Set(enrichedDbLeaves.map((l) => String(l.id)));
      for (const ml of mockLeaves) {
        if (!existingIds.has(String(ml.id))) {
          enrichedDbLeaves.push(ml);
        }
      }
    }

    return setCachedDbValue(cacheKey, enrichedDbLeaves);
  } catch (err) {
    console.error('getTeacherLeaves fatal fallback:', err.message);
    const mockCourses = getMockCoursesForTeacher(teacherId);
    return [...buildMockPendingLeaves(mockCourses), ...buildMockLeaveHistory(mockCourses)];
  }
}
