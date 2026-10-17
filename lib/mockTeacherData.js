// ข้อมูลจำลอง (mock) สำหรับหน้าอาจารย์ — แยกตามอาจารย์แต่ละท่านอย่างเคร่งครัด
// ดึงข้อมูลวิชาจริงจาก Google Drive ปีการศึกษา 2569

const FIRST_NAMES = [
  'จุฑามาศ', 'มงคล', 'สุจิตรา', 'พิชัย', 'วิไล', 'สมเกียรติ', 'ชัยวัฒน์', 'กมลชนก',
  'ธนกร', 'ปิยะดา', 'ณัฐวุฒิ', 'อรอุมา', 'วรากร', 'สุพัตรา', 'ภานุวัฒน์', 'เบญจวรรณ',
  'ศุภกร', 'รัตนาภรณ์', 'อนุชา', 'พรทิพย์',
];
const LAST_NAMES = [
  'แสงทอง', 'ชัยมงคล', 'บุญชู', 'รักดี', 'สมบูรณ์', 'พูนสวัสดิ์', 'จันทร', 'ศรีสุข',
  'วงศ์ษา', 'มีสุข', 'ทองดี', 'แก้วมณี', 'ปัญญาดี', 'เพชรรัตน์', 'สายทอง', 'บุญมี',
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_TOTAL_SESSIONS = 15;
export const MOCK_QUOTA_RATIO = 0.2;

export const MOCK_COURSES_BY_TEACHER = {
  "teacher-teeradech@buu.ac.th": [
    {
      "id": "cmv7kubd3000adtpm1ilrm3x9",
      "code": "24514169",
      "name": "การอ่านเพื่อวิชาชีพสารสนเทศ",
      "term": "1/2569",
      "group": "01",
      "day": "TU",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdc001adtpm20z3zkho",
      "code": "24543164",
      "name": "สัมมนาทิศทางและแนวโน้มทางสารสนเทศศาสตร์",
      "term": "1/2569",
      "group": "01",
      "day": "FR",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdk0022dtpmwroksj64",
      "code": "24517369",
      "name": "ความฉลาดทางดิจิทัล",
      "term": "2/2569",
      "group": "01",
      "day": "TU",
      "time": "13:00-16:50",
      "room": "QS2-701",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdu002ydtpmtgi65myk",
      "code": "24546364",
      "name": "การสร้างสรรค์นวัตกรรมเพื่อการจัดการสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "WE",
      "time": "17:00-19:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-wannaprapa@buu.ac.th": [
    {
      "id": "cmv7kubd3000cdtpmqe5x7rxm",
      "code": "24515169",
      "name": "การจัดการเอกสารและสารสนเทศดิจิทัล",
      "term": "1/2569",
      "group": "02",
      "day": "MO",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd4000edtpmr8ajybci",
      "code": "24516269",
      "name": "สารสนเทศศาสตร์",
      "term": "1/2569",
      "group": "01",
      "day": "MO",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdd001cdtpmh936rp09",
      "code": "24545164",
      "name": "การวิเคราะห์หมวดหมู่ระบบหอสมุดรัฐสภาอเมริกัน",
      "term": "1/2569",
      "group": "01",
      "day": "WE",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdm0028dtpmqhgb7oyc",
      "code": "24525164",
      "name": "การจัดการเอกสารและสารสนเทศอิเล็กทรอนิกส์",
      "term": "2/2569",
      "group": "01",
      "day": "WE",
      "time": "09:00-11:50",
      "room": "QS2-400",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdn002cdtpm0o5o2l5k",
      "code": "24526164",
      "name": "Information Sources and Services",
      "term": "2/2569",
      "group": "01",
      "day": "MO",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdn002edtpm5secau88",
      "code": "24526164",
      "name": "Information Sources and Services",
      "term": "2/2569",
      "group": "02",
      "day": "MO",
      "time": "17:00-19:50",
      "room": "QS2-400",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdx0034dtpmqmocfnmv",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "03",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-khwanchadin@buu.ac.th": [
    {
      "id": "cmv7kubda000ydtpmi4ctvndf",
      "code": "24531464",
      "name": "สารสนเทศสำหรับเด็กและเยาวชน",
      "term": "1/2569",
      "group": "01",
      "day": "TU",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubda0010dtpmd3yz7fvc",
      "code": "24531464",
      "name": "สารสนเทศสำหรับเด็กและเยาวชน",
      "term": "1/2569",
      "group": "02",
      "day": "TU",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdd001edtpmmlu8wpq9",
      "code": "24545464",
      "name": "การวิจัยและสถิติทางสารสนเทศศึกษา",
      "term": "1/2569",
      "group": "01",
      "day": "WE",
      "time": "13:00-16:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdk0024dtpma0ope7zq",
      "code": "24522264",
      "name": "การนำเสนอและการฝึกอบรมในงานสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "TH",
      "time": "08:00-11:50",
      "room": "QS2-407",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubds002odtpm6iuy168q",
      "code": "24533164",
      "name": "การจัดการสถาบันสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "WE",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdy0036dtpmfl07qyq3",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "04",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-chatchapon@buu.ac.th": [
    {
      "id": "cmv7kubd5000kdtpmeltun132",
      "code": "24527364",
      "name": "การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์",
      "term": "1/2569",
      "group": "01",
      "day": "TU",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd6000mdtpmvsyuu26j",
      "code": "24527364",
      "name": "การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์",
      "term": "1/2569",
      "group": "02",
      "day": "TU",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdb0016dtpm13tmt0st",
      "code": "24537264",
      "name": "การออกแบบเว็บสำหรับงานสารสนเทศ",
      "term": "1/2569",
      "group": "01",
      "day": "FR",
      "time": "08:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdm002adtpmqwhehjbm",
      "code": "24525264",
      "name": "วิทยาการคำนวณ",
      "term": "2/2569",
      "group": "01",
      "day": "MO",
      "time": "08:00-11:50",
      "room": "QS2-400",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdt002sdtpmdscot3e4",
      "code": "24537164",
      "name": "การจัดการฐานข้อมูลสำหรับงานสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "WE",
      "time": "13:00-16:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kube00038dtpmm6lxrygc",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "05",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-srihathai@buu.ac.th": [
    {
      "id": "cmv7kubd4000gdtpmhi1x9prs",
      "code": "24521764",
      "name": "การจัดการความรู้",
      "term": "1/2569",
      "group": "01",
      "day": "TU",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd5000idtpmi46d9ox2",
      "code": "24521764",
      "name": "การจัดการความรู้",
      "term": "1/2569",
      "group": "02",
      "day": "TU",
      "time": "16:00-18:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubde001gdtpmss2geysb",
      "code": "24549164",
      "name": "เตรียมสหกิจศึกษา",
      "term": "1/2569",
      "group": "01",
      "day": "TH",
      "time": "08:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdh001qdtpmvwtmdark",
      "code": "89520269",
      "name": "ทักษะดิจิทัลและใช้ปัญญาประดิษฐ์อย่างฉลาด",
      "term": "1/2569",
      "group": "01",
      "day": "MO",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdq002kdtpmj24bf8ic",
      "code": "24531364",
      "name": "สารสนเทศภูมิปัญญาท้องถิ่น",
      "term": "2/2569",
      "group": "01",
      "day": "MO",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdr002mdtpmxxcfnzar",
      "code": "24531364",
      "name": "สารสนเทศภูมิปัญญาท้องถิ่น",
      "term": "2/2569",
      "group": "02",
      "day": "MO",
      "time": "17:00-19:50",
      "room": "QS2-415",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdt002udtpmlkdw0bhl",
      "code": "24541164",
      "name": "จดหมายเหตุและพิพิธภัณฑ์",
      "term": "2/2569",
      "group": "01",
      "day": "TU",
      "time": "16:00-18:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdv0030dtpmgenizxig",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "01",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-akara@buu.ac.th": [
    {
      "id": "cmv7kubd6000odtpmpuhmrryf",
      "code": "24527564",
      "name": "การประยุกต์โปรแกรมกลุ่มโอเพนซอร์ส",
      "term": "1/2569",
      "group": "01",
      "day": "TU",
      "time": "13:00-16:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd7000qdtpm2cw83w3e",
      "code": "24527564",
      "name": "การประยุกต์โปรแกรมกลุ่มโอเพนซอร์ส",
      "term": "1/2569",
      "group": "02",
      "day": "TU",
      "time": "08:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd7000sdtpme1ajito5",
      "code": "24527664",
      "name": "การวิเคราะห์และออกแบบระบบสารสนเทศ",
      "term": "1/2569",
      "group": "01",
      "day": "MO",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdj0020dtpm5k966gdt",
      "code": "24517269",
      "name": "โปรแกรมประยุกต์สำหรับสำนักงานอัตโนมัติ",
      "term": "2/2569",
      "group": "01",
      "day": "TU",
      "time": "08:00-11:50",
      "room": "QS2-407",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdp002idtpmh00vxb6j",
      "code": "24527764",
      "name": "Programming in Information Work",
      "term": "2/2569",
      "group": "01",
      "day": "FR",
      "time": "13:00-16:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kube1003adtpmhym0rbjc",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "06",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-somruethai@buu.ac.th": [
    {
      "id": "cmv7kubd8000udtpm6mcd0fcw",
      "code": "24531264",
      "name": "พฤติกรรมสารสนเทศและผู้ใช้",
      "term": "1/2569",
      "group": "01",
      "day": "FR",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubd9000wdtpmsa4ipfg1",
      "code": "24531264",
      "name": "พฤติกรรมสารสนเทศและผู้ใช้",
      "term": "1/2569",
      "group": "02",
      "day": "FR",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdb0014dtpmhwtr07gr",
      "code": "24535164",
      "name": "การจัดระบบทรัพยากรสารสนเทศ",
      "term": "1/2569",
      "group": "01",
      "day": "TH",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdj001ydtpmbcnjkhq7",
      "code": "24515269",
      "name": "การพัฒนาทรัพยากรสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "MO",
      "time": "09:00-11:50",
      "room": "QS2-400",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubds002qdtpmtuap7mno",
      "code": "24535864",
      "name": "การทำรายการทรัพยากรสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "FR",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ],
  "teacher-preeyanuch@buu.ac.th": [
    {
      "id": "cmv7kubda0012dtpmxn8we23k",
      "code": "24534164",
      "name": "ภาษาอังกฤษเพื่อวิชาชีพสารสนเทศ",
      "term": "1/2569",
      "group": "01",
      "day": "WE",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdc0018dtpm4n61d6ca",
      "code": "24537364",
      "name": "การจัดการระบบห้องสมุดอัตโนมัติ",
      "term": "1/2569",
      "group": "01",
      "day": "MO",
      "time": "08:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdl0026dtpmj4l94tye",
      "code": "24522364",
      "name": "การส่งเสริมบริการสารสนเทศในห้องสมุด",
      "term": "2/2569",
      "group": "01",
      "day": "TU",
      "time": "09:00-11:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdo002gdtpm7uc47kfd",
      "code": "24527164",
      "name": "การค้นคืนสารสนเทศดิจิทัล",
      "term": "2/2569",
      "group": "01",
      "day": "MO",
      "time": "13:00-16:50",
      "room": "QS2-701",
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdu002wdtpmxw3cas5f",
      "code": "24546164",
      "name": "การคิดเชิงออกแบบสำหรับห้องสมุดและสถาบันบริการสารสนเทศ",
      "term": "2/2569",
      "group": "01",
      "day": "TU",
      "time": "13:00-15:50",
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    },
    {
      "id": "cmv7kubdw0032dtpm9wq9km59",
      "code": "24549264",
      "name": "สหกิจศึกษา",
      "term": "2/2569",
      "group": "02",
      "day": null,
      "time": null,
      "room": null,
      "totalSessions": 15,
      "studentCount": 35
    }
  ]
};

export function getMockCoursesForTeacher(identifier) {
  const filterStarted = (arr) => (arr || []).filter((c) => !c.term || c.term !== '2/2569');
  if (!identifier) return filterStarted(MOCK_COURSES_BY_TEACHER['teacher-akara@buu.ac.th']);
  const clean = String(identifier).toLowerCase();
  for (const [email, list] of Object.entries(MOCK_COURSES_BY_TEACHER)) {
    if (clean === email.toLowerCase() || clean.includes(email.split('@')[0]) || email.includes(clean)) {
      return filterStarted(list);
    }
  }
  return filterStarted(MOCK_COURSES_BY_TEACHER['teacher-akara@buu.ac.th']);
}

export const MOCK_COURSES = (MOCK_COURSES_BY_TEACHER['teacher-akara@buu.ac.th'] || []).filter(
  (c) => !c.term || c.term !== '2/2569'
);

export const MOCK_STUDENTS_INFO = {
  '67000001': 'ธนกร วงศ์ษา',
  '67000002': 'ปิยะดา มีสุข',
  '67000003': 'ณัฐวุฒิ ทองดี',
  '67000004': 'อรอุมา แก้วมณี',
  '67000005': 'วรากร ปัญญาดี',
  '67000006': 'สุพัตรา เพชรรัตน์',
  '67000007': 'ภานุวัฒน์ สายทอง',
  '67000008': 'เบญจวรรณ บุญมี',
  '68000001': 'ศุภกร วงศ์สุข',
  '68000002': 'รัตนาภรณ์ ศรีสุวรรณ',
  '68000003': 'อนุชา คำแก้ว',
  '68000004': 'พรทิพย์ อินทร์แก้ว',
  '68000005': 'เอกชัย นาคทอง',
  '68000006': 'ปวีณา บุญรอด',
  '68000007': 'กิตติพงษ์ ทองใบ',
  '68000008': 'นภาพร สุขใจ',
};

export const MOCK_LEAVES_BY_STUDENT = {
  // กลุ่ม 01: 8 คน -> ยื่นลาอนุมัติแล้ว 10 ครั้ง, เสี่ยงหมดสิทธิ์ 1 คน (ปิยะดา ลา 3 ครั้ง)
  // ประเภท: ป่วย 5, กิจ 3, กิจกรรม 1, อื่น ๆ 1 = รวม 10 ครั้ง
  '67000001': [
    { type: 'ลาป่วย', date: '2026-09-02', reason: 'มีอาการไข้หวัด ปวดศีรษะ พักรักษาตัวที่บ้าน', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-09-23', reason: 'ไปทำธุระเอกสารราชการที่ภูมิลำเนา', attachment: null },
  ],
  '67000002': [
    { type: 'ลาป่วย', date: '2026-08-26', reason: 'มีอาการไข้สูง ปวดศีรษะ พบแพทย์ที่ รพ.บูรพา', attachment: '/sample-medical-cert.png' },
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'ท้องเสียเฉียบพลัน อาหารเป็นพิษ พักฟื้น', attachment: '/sample-medical-cert.png' },
    { type: 'ลากิจส่วนตัว', date: '2026-10-07', reason: 'กิจธุระสำคัญของครอบครัวต่างจังหวัด', attachment: null },
  ],
  '67000003': [
    { type: 'ลากิจกรรม', date: '2026-09-09', reason: 'เข้าร่วมกิจกรรมอบรมวิชาการของคณะวิทยาการสารสนเทศ', attachment: '/sample-activity-cert.png' },
  ],
  '67000004': [
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'ปวดฟันคุด มีนัดผ่าตัดช่องปากที่คลินิกทันตกรรม', attachment: null },
    { type: 'อื่นๆ', date: '2026-10-14', reason: 'ประสบอุบัติเหตุเฉี่ยวชนระหว่างเดินทาง', attachment: null },
  ],
  '67000005': [
    { type: 'ลาป่วย', date: '2026-09-30', reason: 'มีไข้หวัด เจ็บคอ แพทย์แนะนำให้พัก 1 วัน', attachment: null },
  ],
  '67000006': [],
  '67000007': [
    { type: 'ลากิจส่วนตัว', date: '2026-10-07', reason: 'ธุระต่ออายุใบขับขี่และบัตรประชาชน', attachment: null },
  ],
  '67000008': [],

  // กลุ่ม 02: 8 คน -> ยื่นลาอนุมัติแล้ว 7 ครั้ง, เสี่ยงหมดสิทธิ์ 0 คน
  // ประเภท: ป่วย 4, กิจ 2, กิจกรรม 1, อื่น ๆ 0 = รวม 7 ครั้ง
  '68000001': [
    { type: 'ลาป่วย', date: '2026-09-02', reason: 'มีอาการไข้หวัด ไอ เจ็บคอ', attachment: null },
  ],
  '68000002': [
    { type: 'ลาป่วย', date: '2026-09-09', reason: 'ไมเกรนกำเริบ พักรักษาตัว', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-09-30', reason: 'งานมงคลสมรสคนในครอบครัว', attachment: null },
  ],
  '68000003': [],
  '68000004': [
    { type: 'ลากิจกรรม', date: '2026-09-23', reason: 'ตัวแทนแข่งขันโครงงานเทคโนโลยีสารสนเทศ', attachment: '/sample-activity-cert.png' },
  ],
  '68000005': [
    { type: 'ลาป่วย', date: '2026-09-16', reason: 'มีอาการไข้และปวดเมื่อยตามร่างกาย', attachment: null },
    { type: 'ลากิจส่วนตัว', date: '2026-10-14', reason: 'เดินทางไปติดต่อราชการกับผู้ปกครอง', attachment: null },
  ],
  '68000006': [],
  '68000007': [
    { type: 'ลาป่วย', date: '2026-10-07', reason: 'พบแพทย์ตามนัดตรวจสุขภาพฟัน', attachment: null },
  ],
  '68000008': [],
};

const WIREFRAME_STUDENTS = [
  { code: '67000001', name: 'ธนกร วงศ์ษา', leavesCount: 2, lastDate: '23/09/2569' },
  { code: '67000002', name: 'ปิยะดา มีสุข', leavesCount: 3, lastDate: '07/10/2569' },
  { code: '67000003', name: 'ณัฐวุฒิ ทองดี', leavesCount: 1, lastDate: '09/09/2569' },
  { code: '67000004', name: 'อรอุมา แก้วมณี', leavesCount: 2, lastDate: '14/10/2569' },
];

export function buildMockRoster(course) {
  const rand = mulberry32(hashSeed(course.id || course.code || 'course'));
  const count = course.studentCount || 8;
  const totalSessions = course.totalSessions || 15;
  const quotaLimit = Math.floor(totalSessions * MOCK_QUOTA_RATIO);
  const roster = [];
  for (let i = 0; i < count; i++) {
    let first, last, code, lastDate = null;
    let approvedLeaves = 0;
    if (i < WIREFRAME_STUDENTS.length) {
      const ws = WIREFRAME_STUDENTS[i];
      const parts = ws.name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ');
      code = ws.code;
      approvedLeaves = ws.leavesCount;
      lastDate = ws.lastDate;
    } else {
      first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
      code = String(67000000 + Math.floor(rand() * 99999)).slice(0, 8);
      approvedLeaves = rand() < 0.12 ? quotaLimit + Math.floor(rand() * 3) + 1 : Math.floor(rand() * 3);
      if (approvedLeaves > 0) {
        const day = String(Math.floor(rand() * 28) + 1).padStart(2, '0');
        const month = String(Math.floor(rand() * 3) + 8).padStart(2, '0');
        lastDate = `${day}/${month}/2569`;
      }
    }
    const attended = Math.max(totalSessions - approvedLeaves, 0);
    const percentage = Math.round((attended / totalSessions) * 100);
    roster.push({
      studentId: `${course.id || course.code}-s${i}`,
      studentCode: code,
      studentName: `${first} ${last}`.trim(),
      email: `${code}@go.buu.ac.th`,
      attended,
      totalSessions,
      approvedLeaves,
      leavesCount: approvedLeaves,
      lastLeaveDate: lastDate,
      quotaLimit,
      percentage,
      overQuota: approvedLeaves >= quotaLimit,
    });
  }
  return roster;
}

const MOCK_LEAVE_TYPES = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่นๆ'];
const MOCK_PERIODS = ['13:00 - 16:50', '13:00 - 16:50', '09:00 - 11:50', '09:00 - 12:00'];
const MOCK_REASONS = [
  'มีนัดพบแพทย์ตามใบนัดโรงพยาบาลมหาวิทยาลัยบูรพา',
  'ติดภารกิจครอบครัวจำเป็นเร่งด่วนต่างจังหวัด',
  'เป็นตัวแทนนิสิตเข้าร่วมกิจกรรมวิชาการของคณะวิทยาการสารสนเทศ',
  'มีอาการไข้หวัด ปวดศีรษะ พักรักษาตัวที่หอพัก',
];

const PENDING_STUDENTS_BY_COURSE_INDEX = [
  { code: '67000006', name: 'สุพัตรา เพชรรัตน์' },
  { code: '68000003', name: 'อนุชา คำแก้ว' },
  { code: '67000008', name: 'เบญจวรรณ บุญมี' },
];

export function buildMockPendingLeaves(courses = []) {
  const validCourses = (courses.length > 0 ? courses : [MOCK_COURSES[0]]).filter(
    (c) => c && (!c.term || c.term !== '2/2569')
  );
  const list = [];
  validCourses.forEach((c, idx) => {
    const groupStr = String(c.group || '01').padStart(2, '0');
    const studentInfo =
      groupStr === '02'
        ? { code: '68000003', name: 'อนุชา คำแก้ว' }
        : PENDING_STUDENTS_BY_COURSE_INDEX[idx % PENDING_STUDENTS_BY_COURSE_INDEX.length];

    list.push({
      id: `pending-leave-${idx + 1}`,
      type: MOCK_LEAVE_TYPES[idx % MOCK_LEAVE_TYPES.length],
      period: c.time ? c.time.replace('-', ' - ') : MOCK_PERIODS[idx % MOCK_PERIODS.length],
      startDate: '2026-10-16',
      endDate: '2026-10-16',
      reason: MOCK_REASONS[idx % MOCK_REASONS.length],
      status: 'รออนุมัติ',
      teacherComment: null,
      attachment: idx === 0 ? '/sample-medical-cert.png' : null,
      createdAt: '2026-10-16T08:30:00',
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      courseTerm: c.term || '1/2569',
      section: c.group || '01',
      studentId: `student-${studentInfo.code}`,
      studentName: studentInfo.name,
      studentCode: studentInfo.code,
      studentEmail: `${studentInfo.code}@go.buu.ac.th`,
    });
  });
  return list;
}

export function buildMockLeaveHistory(courses = []) {
  const validCourses = (courses.length > 0 ? courses : MOCK_COURSES).filter(
    (c) => c && (!c.term || c.term !== '2/2569')
  );
  const list = [];
  validCourses.forEach((c) => {
    const groupStr = String(c.group || '01').padStart(2, '0');
    const studentCodes =
      groupStr === '02'
        ? ['68000001', '68000002', '68000003', '68000004', '68000005', '68000006', '68000007', '68000008']
        : ['67000001', '67000002', '67000003', '67000004', '67000005', '67000006', '67000007', '67000008'];

    studentCodes.forEach((code) => {
      const studentLeaves = MOCK_LEAVES_BY_STUDENT[code] || [];
      const studentName = MOCK_STUDENTS_INFO[code] || `นิสิต (${code})`;
      studentLeaves.forEach((item, idx) => {
        list.push({
          id: `hist-leave-${c.code}-${groupStr}-${code}-${idx + 1}`,
          type: item.type,
          period: c.time ? c.time.replace('-', ' - ') : '13:00 - 16:50',
          startDate: item.date,
          endDate: item.date,
          reason: item.reason,
          status: 'อนุมัติ',
          teacherComment: 'รับทราบและอนุมัติการลา',
          attachment: item.attachment || null,
          createdAt: `${item.date}T08:30:00`,
          approvedAt: `${item.date}T12:00:00`,
          courseId: c.id,
          courseCode: c.code,
          courseName: c.name,
          courseTerm: c.term || '1/2569',
          section: c.group || '01',
          studentId: `student-${code}`,
          studentName,
          studentCode: code,
          studentEmail: `${code}@go.buu.ac.th`,
        });
      });
    });
  });
  return list;
}
