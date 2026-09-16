import { getAttendanceSummary, getCourse, listCoursesForStudent, listLeavesForStudent } from './db';
import { MOCK_COURSES } from './mockTeacherData';

export const MOCK_STUDENT_COURSES = [
  {
    id: 'mock-sc1',
    code: '24527664',
    name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ',
    term: '1/2569',
    group: '01',
    totalSessions: 15,
    teacherName: 'ผศ.ดร.อัครา',
    day: 'MO',
    time: '13:00-15:50',
    room: 'IF-3M210',
    teacher: { id: 't1', name: 'ผศ.ดร.อัครา' },
  },
  {
    id: 'mock-sc2',
    code: '24527564',
    name: 'การประยุกต์โปรแกรมโอเพนซอร์ส',
    term: '1/2569',
    group: '01',
    totalSessions: 15,
    teacherName: 'ดร.ธีรเดช',
    day: 'TU',
    time: '13:00-16:50',
    room: 'IF-4C01',
    teacher: { id: 't2', name: 'ดร.ธีรเดช' },
  },
  {
    id: 'mock-sc3',
    code: '24535164',
    name: 'การจัดการทรัพยากรสารสนเทศ',
    term: '1/2569',
    group: '01',
    totalSessions: 15,
    teacherName: 'อ.สมฤทัย',
    day: 'TH',
    time: '09:00-11:50',
    room: 'IF-3M280',
    teacher: { id: 't3', name: 'อ.สมฤทัย' },
  },
  {
    id: 'mock-sc4',
    code: '24537364',
    name: 'ระบบห้องสมุดอัตโนมัติ',
    term: '1/2569',
    group: '01',
    totalSessions: 15,
    teacherName: 'ผศ.ดร.ปรียานุช',
    day: 'MO',
    time: '08:00-11:50',
    room: 'IF-3M280',
    teacher: { id: 't4', name: 'ผศ.ดร.ปรียานุช' },
  },
];

export const MOCK_STUDENT_SUMMARIES = [
  {
    course: MOCK_STUDENT_COURSES[0],
    totalSessions: 15,
    approvedLeaves: 1,
    attended: 14,
    percentage: 93,
    quotaLimit: 3,
    overQuota: false,
  },
  {
    course: MOCK_STUDENT_COURSES[1],
    totalSessions: 15,
    approvedLeaves: 2,
    attended: 13,
    percentage: 86,
    quotaLimit: 3,
    overQuota: false,
  },
  {
    course: MOCK_STUDENT_COURSES[2],
    totalSessions: 15,
    approvedLeaves: 0,
    attended: 15,
    percentage: 100,
    quotaLimit: 3,
    overQuota: false,
  },
  {
    course: MOCK_STUDENT_COURSES[3],
    totalSessions: 15,
    approvedLeaves: 1,
    attended: 14,
    percentage: 93,
    quotaLimit: 3,
    overQuota: false,
  },
];

export const MOCK_STUDENT_LEAVES = [
  {
    id: 101,
    studentId: 'student-mock',
    courseId: 'mock-sc1',
    courseCode: '24527664',
    courseName: '24527664 การวิเคราะห์และออกแบบระบบสารสนเทศ',
    courseTitle: 'การวิเคราะห์และออกแบบระบบสารสนเทศ',
    courseTerm: '1/2569',
    courseGroup: '01',
    teacherName: 'ผศ.ดร.อัครา',
    type: 'ลาป่วย',
    period: 'เต็มคาบเรียน 3 ชั่วโมง',
    startDate: '2026-08-20',
    endDate: '2026-08-20',
    reason: 'มีไข้สูงและปวดศีรษะ พบแพทย์ตามใบรับรองแพทย์',
    attachment: null,
    status: 'อนุมัติ',
    teacherComment: 'อนุมัติการลาตามระเบียบเรียบร้อย',
    createdAt: '2026-08-20T08:30:00.000Z',
  },
  {
    id: 102,
    studentId: 'student-mock',
    courseId: 'mock-sc2',
    courseCode: '24527564',
    courseName: '24527564 การประยุกต์โปรแกรมโอเพนซอร์ส',
    courseTitle: 'การประยุกต์โปรแกรมโอเพนซอร์ส',
    courseTerm: '1/2569',
    courseGroup: '01',
    teacherName: 'ดร.ธีรเดช',
    type: 'ลากิจส่วนตัว',
    period: 'เต็มคาบเรียน 3 ชั่วโมง',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    reason: 'เข้าร่วมงานบวชพี่ชายต่างจังหวัด',
    attachment: null,
    status: 'รออนุมัติ',
    teacherComment: null,
    createdAt: '2026-08-24T14:15:00.000Z',
  },
  {
    id: 103,
    studentId: 'student-mock',
    courseId: 'mock-sc4',
    courseCode: '24537364',
    courseName: '24537364 ระบบห้องสมุดอัตโนมัติ',
    courseTitle: 'ระบบห้องสมุดอัตโนมัติ',
    courseTerm: '1/2569',
    courseGroup: '01',
    teacherName: 'ผศ.ดร.ปรียานุช',
    type: 'ลากิจกรรม',
    period: 'เต็มคาบเรียน 3 ชั่วโมง',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    reason: 'เป็นตัวแทนเข้าร่วมการแข่งขันนำเสนอโครงงานวิชาการของมหาวิทยาลัย',
    attachment: null,
    status: 'อนุมัติ',
    teacherComment: 'อนุมัติเนื่องจากเป็นตัวแทนกิจกรรมคณะ/มหาวิทยาลัย',
    createdAt: '2026-08-14T10:00:00.000Z',
  },
];

export async function getStudentData(studentId) {
  try {
    const realCourses = await listCoursesForStudent(studentId);
    if (realCourses && realCourses.length > 0) {
      const rawSummaries = await Promise.all(realCourses.map((c) => getAttendanceSummary(studentId, c.id)));
      const summaries = rawSummaries.filter(Boolean);
      const rawLeaves = await listLeavesForStudent(studentId);
      const leaves = await Promise.all(
        rawLeaves.map(async (l) => {
          const course = await getCourse(l.courseId);
          return {
            ...l,
            courseCode: course?.code || '',
            courseName: course ? `${course.code} ${course.name}` : '-',
            courseTitle: course?.name || '',
            courseTerm: course?.term || '',
            courseGroup: course?.group || '',
            teacherName: course?.teacher?.name || course?.teacherName || '',
          };
        })
      );
      return { courses: realCourses, summaries, leaves, usingMock: false };
    }
  } catch (err) {
    console.error('Error fetching real student data, falling back to mock:', err);
  }

  // Fallback to mock data for demo / prototype
  return {
    courses: MOCK_STUDENT_COURSES,
    summaries: MOCK_STUDENT_SUMMARIES,
    leaves: MOCK_STUDENT_LEAVES,
    usingMock: true,
  };
}
