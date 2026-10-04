export const COURSE_PREP_DATA = {
  '24527664': {
    week: 6,
    topic: 'การวิเคราะห์และออกแบบโมเดลกระบวนการ (Data Flow Diagram - DFD)',
    description: 'เรียนรู้หลักการเขียน DFD Level 0 และ Level 1 กฎความสมดุลข้อมูล (Balancing) และข้อผิดพลาดที่พบบ่อย',
    preClassTasks: [
      'ทบทวนสัญลักษณ์ DFD (Process, Data Store, Data Flow, External Entity)',
      'ติดตั้งซอฟต์แวร์ Draw.io หรือ Visual Paradigm บนคอมพิวเตอร์พกพา',
      'อ่านเอกสารประกอบการสอนบทที่ 5 เรื่อง Process Modeling',
    ],
    examHighlights: [
      'การระบุข้อผิดพลาดใน DFD: Black Hole, Miracle, Grey Hole',
      'ความแตกต่างระหว่าง Context Diagram และ DFD Level 0',
      'การทำ Data Dictionary และโครงสร้าง Data Flow',
    ],
    materials: [
      { name: 'สไลด์บทที่ 5: Data Flow Diagram (PDF)', size: '4.2 MB' },
      { name: 'แบบฝึกหัด DFD Workshop Case Study (DOCX)', size: '820 KB' },
    ],
    syllabus: [
      { week: 1, topic: 'Introduction to Systems Analysis and Design', status: 'done' },
      { week: 2, topic: 'Project Identification and Selection', status: 'done' },
      { week: 3, topic: 'Requirements Determination & Fact-Finding', status: 'done' },
      { week: 4, topic: 'Use Case Modeling and Scenarios', status: 'done' },
      { week: 5, topic: 'Context Diagram & Functional Decomposition', status: 'done' },
      { week: 6, topic: 'Process Modeling: DFD Level 0 & Level 1', status: 'current' },
      { week: 7, topic: 'Data Modeling: Entity-Relationship Diagram (ERD)', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
      { week: 9, topic: 'Database Design and Normalization (1NF-3NF)', status: 'upcoming' },
      { week: 10, topic: 'User Interface & Input/Output Design', status: 'upcoming' },
    ],
  },
  '24537364': {
    week: 6,
    topic: 'การลงรายการบรรณานุกรมด้วยมาตรฐาน MARC 21 และ RDA',
    description: 'ฝึกปฏิบัติการลงรายการระเบียนข้อมูลบรรณานุกรมหนังสือและสื่อดิจิทัลในระบบห้องสมุดอัตโนมัติ KOHA',
    preClassTasks: [
      'ศึกษาความหมายของ Tag สำคัญใน MARC 21: Tag 100, 245, 260/264, 650',
      'เตรียมตัวอย่างหนังสือภาษาไทย 1 เล่ม เพื่อใช้ฝึกปฏิบัติลงรายการ',
    ],
    examHighlights: [
      'โครงสร้างของระเบียน MARC 21 (Leader, Directory, Variable Control/Data Fields)',
      'ความแตกต่างระหว่างมาตรฐาน MARC 21 กับ Dublin Core',
    ],
    materials: [
      { name: 'คู่มือการลงรายการ MARC 21 ฉบับย่อ (PDF)', size: '2.8 MB' },
      { name: 'ใบงานระบบ KOHA Cataloging (PDF)', size: '1.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'ภาพรวมระบบห้องสมุดอัตโนมัติและโมดูลการทำงาน', status: 'done' },
      { week: 2, topic: 'มาตรฐานข้อมูลทางบรรณานุกรม', status: 'done' },
      { week: 3, topic: 'สถาปัตยกรรมระบบ Open Source Library Systems', status: 'done' },
      { week: 4, topic: 'การติดตั้งและการตั้งค่าระบบ KOHA', status: 'done' },
      { week: 5, topic: 'โมดูลการจัดหาทรัพยากร (Acquisitions Module)', status: 'done' },
      { week: 6, topic: 'การลงรายการ MARC 21 & RDA (Cataloging)', status: 'current' },
      { week: 7, topic: 'ระบบยืม-คืนและการจัดการสมาชิก (Circulation)', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
    ],
  },
  '24527364': {
    week: 6,
    topic: 'การจัดสรรหมายเลขไอพีและการแบ่งเครือข่ายย่อย (IPv4 Subnetting & CIDR)',
    description: 'คำนวณหมายเลขเครือข่าย Subnet Mask, Network ID, Broadcast ID และ Usable Hosts สำหรับแต่ละแผนก',
    preClassTasks: [
      'ทบทวนเลขฐานสองและการแปลงระหว่างฐาน 10 กับฐาน 2 (Binary Conversion)',
      'ติดตั้งโปรแกรม Cisco Packet Tracer บนแล็ปท็อปเพื่อทำแล็บ',
    ],
    examHighlights: [
      'การคำนวณ Subnet Mask จาก Prefix notation (/24, /26, /28)',
      'การหา Broadcast Address และ First/Last Host IP',
      'แนวคิด Variable Length Subnet Mask (VLSM)',
    ],
    materials: [
      { name: 'สไลด์บทที่ 6: IP Addressing & Subnetting (PDF)', size: '3.6 MB' },
      { name: 'Lab Sheet: Packet Tracer Subnetting Config (PKT)', size: '450 KB' },
    ],
    syllabus: [
      { week: 1, topic: 'Introduction to Computer Networks & Topologies', status: 'done' },
      { week: 2, topic: 'OSI 7 Layers Model vs TCP/IP Protocol Suite', status: 'done' },
      { week: 3, topic: 'Physical Layer & Data Link Layer Fundamentals', status: 'done' },
      { week: 4, topic: 'Ethernet & Address Resolution Protocol (ARP)', status: 'done' },
      { week: 5, topic: 'Network Layer & IPv4 Addressing Basics', status: 'done' },
      { week: 6, topic: 'IPv4 Subnetting & CIDR Calculation', status: 'current' },
      { week: 7, topic: 'Routing Protocols: Static Routing & RIP', status: 'upcoming' },
      { week: 8, topic: 'สอบกลางภาค (Midterm Examination)', status: 'exam' },
    ],
  },
  '24535164': {
    week: 6,
    topic: 'นโยบายการจัดหาและการบริหารสัญญาทรัพยากรสารสนเทศดิจิทัล',
    description: 'ศึกษาข้อตกลงการใช้งานฐานข้อมูลออนไลน์ กฎหมายลิขสิทธิ์ และรูปแบบ Open Access Publishing',
    preClassTasks: [
      'อ่านเอกสารกรณีศึกษานโยบายการบอกรับฐานข้อมูลอิเล็กทรอนิกส์ของสำนักหอสมุด',
      'สรุปประเด็นลิขสิทธิ์ Creative Commons (CC License) แต่ละประเภท',
    ],
    examHighlights: [
      'วงจรการบริหารทรัพยากรสารสนเทศ (Collection Management Lifecycle)',
      'รูปแบบลิขสิทธิ์ CC-BY, CC-NC, CC-ND, CC-SA',
    ],
    materials: [
      { name: 'เอกสารคำสอน: นโยบายและสัญญาอนุญาตสารสนเทศ (PDF)', size: '2.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'แนวคิดและขอบเขตการจัดการทรัพยากรสารสนเทศ', status: 'done' },
      { week: 2, topic: 'การประเมินความต้องการสารสนเทศของผู้ใช้', status: 'done' },
      { week: 3, topic: 'การคัดเลือกและจัดหาทรัพยากรตีพิมพ์', status: 'done' },
      { week: 4, topic: 'การจัดหาทรัพยากรอิเล็กทรอนิกส์และดิจิทัล', status: 'done' },
      { week: 5, topic: 'การบริหารงบประมาณและการจัดซื้อ', status: 'done' },
      { week: 6, topic: 'นโยบายและการบริหารสัญญาทรัพยากรดิจิทัล', status: 'current' },
      { week: 7, topic: 'การอนุรักษ์และการจำหน่ายทรัพยากรสารสนเทศ', status: 'upcoming' },
    ],
  },
  '24531264': {
    week: 6,
    topic: 'แบบจำลองพฤติกรรมการแสวงหาสารสนเทศ (Wilson & Kuhlthau Models)',
    description: 'วิเคราะห์กระบวนการค้นหาและเข้าถึงสารสนเทศของผู้ใช้ตาม Information Search Process (ISP)',
    preClassTasks: [
      'เตรียมประเด็นการสัมภาษณ์กลุ่มตัวอย่างเกี่ยวกับพฤติกรรมการสืบค้นข้อมูลงานวิจัย',
      'อ่านบทความวิจัยกรณีศึกษาพฤติกรรมผู้ใช้ของ Kuhlthau (1991)',
    ],
    examHighlights: [
      '6 ขั้นตอนของกระบวนการสืบค้นสารสนเทศตามโมเดล ISP ของ Kuhlthau',
      'ปัจจัยทางจิตวิทยาและสิ่งแวดล้อมที่ส่งผลต่อการแสวงหาสารสนเทศ',
    ],
    materials: [
      { name: 'สไลด์บทที่ 6: Information Seeking Behavior Models (PDF)', size: '3.1 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'บทนำสู่พฤติกรรมสารสนเทศและผู้ใช้สารสนเทศ', status: 'done' },
      { week: 2, topic: 'ความต้องการสารสนเทศและบริบทของผู้ใช้', status: 'done' },
      { week: 3, topic: 'แบบจำลองพฤติกรรมสารสนเทศยุคแรก', status: 'done' },
      { week: 4, topic: 'แบบจำลองของ Ellis และ Dervin (Sense-Making)', status: 'done' },
      { week: 5, topic: 'แบบจำลองของ Wilson (1981, 1996, 1999)', status: 'done' },
      { week: 6, topic: 'แบบจำลอง ISP ของ Kuhlthau', status: 'current' },
      { week: 7, topic: 'พฤติกรรมสารสนเทศในยุคปัญญาประดิษฐ์และโซเชียลมีเดีย', status: 'upcoming' },
    ],
  },
  '89539764': {
    week: 6,
    topic: 'การออกแบบโมเดลธุรกิจด้วย Business Model Canvas (BMC) 9 ช่อง',
    description: 'ทดสอบคุณค่าของสินค้าและบริการ (Value Proposition) และวิเคราะห์กลุ่มลูกค้าเป้าหมาย (Customer Segments)',
    preClassTasks: [
      'ร่างไอเดียนวัตกรรมหรือผลิตภัณฑ์ของกลุ่ม 1 ไอเดียลงบน BMC Template',
      'เตรียมสไลด์นำเสนอ Elevator Pitch ความยาว 2 นาทีต่อกลุ่ม',
    ],
    examHighlights: [
      'ความสัมพันธ์ระหว่าง Customer Segments และ Value Propositions',
      'โครงสร้างต้นทุน (Cost Structure) และกระแสรายได้ (Revenue Streams)',
    ],
    materials: [
      { name: 'เทมเพลต Business Model Canvas (PDF)', size: '1.4 MB' },
      { name: 'สไลด์การบรรยาย: Startup & Innovation Strategy (PDF)', size: '4.8 MB' },
    ],
    syllabus: [
      { week: 1, topic: 'แนวคิดการเป็นผู้ประกอบการในศตวรรษที่ 21', status: 'done' },
      { week: 2, topic: 'การค้นหาโอกาสและไอเดียธุรกิจนวัตกรรม', status: 'done' },
      { week: 3, topic: 'Design Thinking: Empathize & Define', status: 'done' },
      { week: 4, topic: 'Design Thinking: Ideate & Prototype', status: 'done' },
      { week: 5, topic: 'การวิเคราะห์ตลาดและพฤติกรรมผู้บริโภค', status: 'done' },
      { week: 6, topic: 'Business Model Canvas (BMC) 9 ช่อง', status: 'current' },
      { week: 7, topic: 'การเงินเบื้องต้นสำหรับผู้ประกอบการ', status: 'upcoming' },
    ],
  },
};

export function getCoursePrep(code) {
  return (
    COURSE_PREP_DATA[code] || {
      week: 6,
      topic: 'เนื้อหาและการเตรียมตัวประจำสัปดาห์ที่ 6',
      description: 'ศึกษาและเตรียมตัวล่วงหน้าก่อนเข้าห้องเรียนตามข้อกำหนดรายวิชา',
      preClassTasks: [
        'ทบทวนเนื้อหาบทเรียนของสัปดาห์ก่อนหน้า',
        'จัดเตรียมแล็ปท็อปและเอกสารประกอบการเรียน',
      ],
      examHighlights: [
        'คอนเซ็ปต์หลักและศัพท์สำคัญประจำบทเรียน',
        'การประยุกต์ใช้งานในสถานการณ์จริง',
      ],
      materials: [{ name: `เอกสารประกอบการสอนวิชา ${code} (PDF)`, size: '2.5 MB' }],
      syllabus: [
        { week: 1, topic: 'แนะนำรายวิชาและเกณฑ์การให้คะแนน', status: 'done' },
        { week: 6, topic: 'บทเรียนสัปดาห์ที่ 6', status: 'current' },
        { week: 8, topic: 'สอบกลางภาค (Midterm)', status: 'exam' },
      ],
    }
  );
}
