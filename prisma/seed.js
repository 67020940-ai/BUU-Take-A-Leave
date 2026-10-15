// ข้อมูลตั้งต้นสำหรับ BUU Take A Leave
// ซิงก์ตรงจากไฟล์ Google Drive: ตารางสอนอาจารย์ และ ตารางเรียนนิสิต ปีการศึกษา 2569
// ครอบคลุมทั้งภาคเรียนที่ 1/2569 และ ภาคเรียนที่ 2/2569
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();
const PASSWORD_PLAIN = '1234';

const TEACHERS = [
  {
    "email": "teacher-teeradech@buu.ac.th",
    "name": "ดร.ธีรเดช มานะกุล",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-wannaprapa@buu.ac.th",
    "name": "ผศ.วรรณประภา เอี่ยมฤทธิ์",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-khwanchadin@buu.ac.th",
    "name": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-chatchapon@buu.ac.th",
    "name": "ผศ.ดร.ณิชพน โชติจันทรกุล",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-srihathai@buu.ac.th",
    "name": "ผศ.ดร.ศรีหทัย เวลล์ส",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-akara@buu.ac.th",
    "name": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-somruethai@buu.ac.th",
    "name": "อ.สมฤทัย ธีรเรืองสิริ",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  },
  {
    "email": "teacher-preeyanuch@buu.ac.th",
    "name": "ผศ.ดร.ปรียานุช วรวิกโฆษิต",
    "faculty": "คณะวิทยาการสารสนเทศ",
    "major": "ภาควิชาสารสนเทศศึกษา"
  }
];

const COURSES = [
  {
    "code": "24514169",
    "name": "การอ่านเพื่อวิชาชีพสารสนเทศ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ดร.ธีรเดช มานะกุล"
  },
  {
    "code": "24515169",
    "name": "การจัดการเอกสารและสารสนเทศดิจิทัล",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "MO",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24516269",
    "name": "สารสนเทศศาสตร์",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24521764",
    "name": "การจัดการความรู้",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24521764",
    "name": "การจัดการความรู้",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "TU",
    "time": "16:00-18:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24527364",
    "name": "การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24527364",
    "name": "การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24527564",
    "name": "การประยุกต์โปรแกรมกลุ่มโอเพนซอร์ส",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-16:50",
    "room": null,
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  },
  {
    "code": "24527564",
    "name": "การประยุกต์โปรแกรมกลุ่มโอเพนซอร์ส",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "TU",
    "time": "08:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  },
  {
    "code": "24527664",
    "name": "การวิเคราะห์และออกแบบระบบสารสนเทศ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  },
  {
    "code": "24531264",
    "name": "พฤติกรรมสารสนเทศและผู้ใช้",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "FR",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "อ.สมฤทัย ธีรเรืองสิริ"
  },
  {
    "code": "24531264",
    "name": "พฤติกรรมสารสนเทศและผู้ใช้",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "FR",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "อ.สมฤทัย ธีรเรืองสิริ"
  },
  {
    "code": "24531464",
    "name": "สารสนเทศสำหรับเด็กและเยาวชน",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24531464",
    "name": "สารสนเทศสำหรับเด็กและเยาวชน",
    "term": "1/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24534164",
    "name": "ภาษาอังกฤษเพื่อวิชาชีพสารสนเทศ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24535164",
    "name": "การจัดระบบทรัพยากรสารสนเทศ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TH",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "อ.สมฤทัย ธีรเรืองสิริ"
  },
  {
    "code": "24537264",
    "name": "การออกแบบเว็บสำหรับงานสารสนเทศ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "FR",
    "time": "08:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24537364",
    "name": "การจัดการควระบบห้องสมุดอัตโนมัติ",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "08:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24543164",
    "name": "สัมนาทิศทางและแนวโน้มทางสารสนเทศศาสตร์",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "FR",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ดร.ธีรเดช มานะกุล"
  },
  {
    "code": "24545164",
    "name": "การวิเคราะห์หมวดหมู่ระบบหอสมุดรัฐสภาอเมริกัน",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24545464",
    "name": "การวิจัยและสถิติทางสารสนเทศศึกษา",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "13:00-16:50",
    "room": null,
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24549164",
    "name": "เตรียมสหกิจศึกษา",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TH",
    "time": "08:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "89510169",
    "name": "การสื่อสารภาษาอังกฤษ",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89510764",
    "name": "ความรัก เพศสัมพันธ์และสุขภาพ",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89520169",
    "name": "การแก้ไขปัญหาอย่างสร้างสรรค์ในยุคดิจิทัล",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89520264",
    "name": "กระบวนการคิดเพื่อเข้าใจตนเองและผู้อื่น",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89520269",
    "name": "ทักษะดิจิทัลและใช้ปัญญาประดิษฐ์อย่างฉลาด",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "89520364",
    "name": "กิจกรรมสร้างสรรค์",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89530064",
    "name": "โอกาสและความท้าทายในการทำงานในโลกอนาคต",
    "term": "1/2569",
    "group": "",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "89539764",
    "name": "การเป็นผู้ประกอบการในศตวรรษที่ 21",
    "term": "1/2569",
    "group": "01",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": null
  },
  {
    "code": "24515269",
    "name": "การพัฒนาทรัพยากรสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "09:00-11:50",
    "room": "QS2-400",
    "teacherName": "อ.สมฤทัย ธีรเรืองสิริ"
  },
  {
    "code": "24517269",
    "name": "โปรแกรมประยุกต์สำหรับสำนักงานอัตโนมัติ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "08:00-11:50",
    "room": "QS2-407",
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  },
  {
    "code": "24517369",
    "name": "ความฉลาดทางดิจิทัล",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-16:50",
    "room": "QS2-701",
    "teacherName": "ดร.ธีรเดช มานะกุล"
  },
  {
    "code": "24522264",
    "name": "การนำเสนอและการฝึกอบรมในงานสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TH",
    "time": "08:00-11:50",
    "room": "QS2-407",
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24522364",
    "name": "การส่งเสริมบริการสารสนเทศในห้องสมุด",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24525164",
    "name": "การจัดการเอกสารและสารสนเทศอิเล็กทรอนิกส์",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "09:00-11:50",
    "room": "QS2-400",
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24525264",
    "name": "วิทยาการคำนวณ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "08:00-11:50",
    "room": "QS2-400",
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24526164",
    "name": "Information Sources and Services",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24526164",
    "name": "Information Sources and Services",
    "term": "2/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "MO",
    "time": "17:00-19:50",
    "room": "QS2-400",
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24527164",
    "name": "การค้นคืนสารสนเทศดิจิทัล",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "13:00-16:50",
    "room": "QS2-701",
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24527764",
    "name": "Programming in Information Work",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "FR",
    "time": "13:00-16:50",
    "room": null,
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  },
  {
    "code": "24531364",
    "name": "สารสนเทศภูมิปัญญาท้องถิ่น",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "MO",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24531364",
    "name": "สารสนเทศภูมิปัญญาท้องถิ่น",
    "term": "2/2569",
    "group": "02",
    "totalSessions": 15,
    "day": "MO",
    "time": "17:00-19:50",
    "room": "QS2-415",
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24533164",
    "name": "การจัดการสถาบันสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24535864",
    "name": "การทำรายการทรัพยากรสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "FR",
    "time": "09:00-11:50",
    "room": null,
    "teacherName": "อ.สมฤทัย ธีรเรืองสิริ"
  },
  {
    "code": "24537164",
    "name": "การจัดการฐานข้อมูลสำหรับงานสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "13:00-16:50",
    "room": null,
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24541164",
    "name": "จดหมายเหตุและพิพิธภัณฑ์",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "16:00-18:50",
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24546164",
    "name": "การคิดเชิงออกแบบสำหรับห้องสมุดและสถาบันบริการสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "TU",
    "time": "13:00-15:50",
    "room": null,
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24546364",
    "name": "การสร้างสรรค์นวัตกรรมเพื่อการจัดการสารสนเทศ",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": "WE",
    "time": "17:00-19:50",
    "room": null,
    "teacherName": "ดร.ธีรเดช มานะกุล"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "01",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.ดร.ศรีหทัย เวลล์ส"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "02",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.ดร.ปรียานุช วรวิกโฆษิต"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "03",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.วรรณประภา เอี่ยมฤทธิ์"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "04",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.ดร.ขวัญชฎิล พิศาลพงศ์"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "05",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.ดร.ณิชพน โชติจันทรกุล"
  },
  {
    "code": "24549264",
    "name": "สหกิจศึกษา",
    "term": "2/2569",
    "group": "06",
    "totalSessions": 15,
    "day": null,
    "time": null,
    "room": null,
    "teacherName": "ผศ.ดร.อัครา ธรรมมาสถิตย์กุล"
  }
];

const ENROLLMENTS_DATA = [
  {
    "studentId": "66000001",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24527364#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24531464#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24537264#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24543164#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24545164#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24545464#1/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24549164#1/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "66000001",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000001",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000002",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "66000003",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000003",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000004",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "66000005",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000005",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000006",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "66000007",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000007",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "66000008",
    "courseKey": "24549264#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000001",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000002",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000003",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000004",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000005",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000006",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000007",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24521764#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24527364#1/2569#02"
  },
  {
    "studentId": "67000008",
    "courseKey": "24527564#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24527664#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24531264#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24535164#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24537364#1/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "89539764#1/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000001",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000002",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000003",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000004",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000005",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000006",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000007",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24522364#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24526164#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24527764#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24531364#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24533164#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24535864#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24537164#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24541164#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24546164#2/2569#01"
  },
  {
    "studentId": "67000008",
    "courseKey": "24546364#2/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000001",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000001",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000001",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000001",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000001",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000001",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000001",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000002",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000002",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000002",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000002",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000002",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000003",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000003",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000003",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000003",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000003",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000004",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000004",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000004",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000004",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000004",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000005",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000005",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000005",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000005",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000005",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000006",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000006",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000006",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000006",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000006",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000007",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000007",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000007",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000007",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000007",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000008",
    "courseKey": "24521764#1/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24527564#1/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24531264#1/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24531464#1/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24534164#1/2569#01"
  },
  {
    "studentId": "68000008",
    "courseKey": "89510764#1/2569#"
  },
  {
    "studentId": "68000008",
    "courseKey": "89520264#1/2569#"
  },
  {
    "studentId": "68000008",
    "courseKey": "89520364#1/2569#"
  },
  {
    "studentId": "68000008",
    "courseKey": "89530064#1/2569#"
  },
  {
    "studentId": "68000001",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000001",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000001",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000002",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000002",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000002",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000002",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000002",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000003",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000003",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000003",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000003",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000003",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000004",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000004",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000004",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000004",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000004",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000005",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000005",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000005",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000005",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000005",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000006",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000006",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000006",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000006",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000006",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000007",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000007",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000007",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000007",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000007",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24522264#2/2569#01"
  },
  {
    "studentId": "68000008",
    "courseKey": "24525164#2/2569#01"
  },
  {
    "studentId": "68000008",
    "courseKey": "24525264#2/2569#01"
  },
  {
    "studentId": "68000008",
    "courseKey": "24526164#2/2569#02"
  },
  {
    "studentId": "68000008",
    "courseKey": "24527164#2/2569#01"
  },
  {
    "studentId": "68000008",
    "courseKey": "24531364#2/2569#02"
  },
  {
    "studentId": "69000001",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000001",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000001",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000001",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000001",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000001",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000002",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000002",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000002",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000003",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000003",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000003",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000004",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000004",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000004",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000005",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000005",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000005",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000006",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000006",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000006",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000007",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000007",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000007",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "24514169#1/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "24515169#1/2569#02"
  },
  {
    "studentId": "69000008",
    "courseKey": "24516269#1/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "89510169#1/2569#"
  },
  {
    "studentId": "69000008",
    "courseKey": "89520169#1/2569#"
  },
  {
    "studentId": "69000008",
    "courseKey": "89520269#1/2569#01"
  },
  {
    "studentId": "69000001",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000001",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000001",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000002",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000003",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000004",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000005",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000006",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000007",
    "courseKey": "24517369#2/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "24515269#2/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "24517269#2/2569#01"
  },
  {
    "studentId": "69000008",
    "courseKey": "24517369#2/2569#01"
  }
];

const STUDENT_NAMES = [
  'จุฑามาศ แสงทอง', 'มงคล ชัยมงคล', 'สุจิตรา บุญชู', 'พิชัย รักดี',
  'วิไล สมบูรณ์', 'สมเกียรติ พูนสวัสดิ์', 'ชัยวัฒน์ จันทร', 'กมลชนก ศรีสุข',
  'ธนกร วงศ์ษา', 'ปิยะดา มีสุข', 'ณัฐวุฒิ ทองดี', 'อรอุมา แก้วมณี',
  'วรากร ปัญญาดี', 'สุพัตรา เพชรรัตน์', 'ภานุวัฒน์ สายทอง', 'เบญจวรรณ บุญมี',
  'ศุภกร วงศ์สุข', 'รัตนาภรณ์ ศรีสุวรรณ', 'อนุชา คำแก้ว', 'พรทิพย์ อินทร์แก้ว',
  'เอกชัย นาคทอง', 'ปวีณา บุญรอด', 'กิตติพงษ์ ทองใบ', 'นภาพร สุขใจ',
  'ธีรภัทร มั่นคง', 'อัจฉรา ผลบุญ', 'วีรยุทธ ใจกล้า', 'สุนิสา แก้วประเสริฐ',
  'อภิสิทธิ์ รุ่งเรือง', 'ดวงใจ สว่างวงศ์', 'กฤษณะ ทิพย์รักษ์', 'มัณฑนา ศรีวิไล',
];

async function main() {
  console.log('Seeding database with updated Google Drive metadata...');
  const password = await bcrypt.hash(PASSWORD_PLAIN, 10);
  const adminRows = [];
  const teacherRowList = [];
  const studentRows = [];

  // ล้างข้อมูลเดิมทั้งหมด
  await prisma.notification.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // 1. แอดมิน
  const admin = await prisma.user.create({
    data: {
      email: 'admin@buu.ac.th',
      password,
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
      faculty: 'คณะวิทยาการสารสนเทศ',
      major: 'ภาควิชาสารสนเทศศึกษา',
    },
  });
  adminRows.push({ name: admin.name, email: admin.email, password: PASSWORD_PLAIN });

  // 2. อาจารย์
  const teacherByName = {};
  for (const t of TEACHERS) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        password,
        name: t.name,
        role: 'teacher',
        faculty: t.faculty || 'คณะวิทยาการสารสนเทศ',
        major: t.major || 'ภาควิชาสารสนเทศศึกษา',
      },
    });
    teacherByName[t.name] = user;
    teacherRowList.push({
      name: t.name,
      email: t.email,
      password: PASSWORD_PLAIN,
      subjects: '',
    });
  }

  // 3. รายวิชา
  const courseByKey = {};
  for (const c of COURSES) {
    const teacher = c.teacherName ? teacherByName[c.teacherName] : null;
    const course = await prisma.course.create({
      data: {
        code: c.code,
        name: c.name,
        term: c.term,
        group: c.group || '',
        totalSessions: c.totalSessions || 15,
        day: c.day || null,
        time: c.time || null,
        room: c.room || null,
        teacherId: teacher?.id || null,
        teacherName: teacher?.name || null,
      },
    });
    const key = `${c.code}#${c.term}#${c.group || ""}`;
    courseByKey[key] = course;

    if (c.teacherName) {
      const row = teacherRowList.find((r) => r.name === c.teacherName);
      if (row) {
        const label = c.group ? `${c.code}-${c.group} [${c.term}]` : `${c.code} [${c.term}]`;
        row.subjects = row.subjects ? `${row.subjects}, ${label}` : label;
      }
    }
  }

  // 4. นิสิต
  const studentByCode = {};
  const students = [];
  let nameIndex = 0;
  for (const cohort of [66, 67, 68, 69]) {
    for (let i = 1; i <= 8; i++) {
      const studentId = `${cohort}${String(i).padStart(6, "0")}`;
      const name = STUDENT_NAMES[nameIndex % STUDENT_NAMES.length];
      nameIndex++;

      const student = await prisma.user.create({
        data: {
          email: `${studentId}@go.buu.ac.th`,
          password,
          name,
          role: 'student',
          studentId,
          faculty: 'คณะวิทยาการสารสนเทศ',
          major: 'ภาควิชาสารสนเทศศึกษา',
          department: 'ภาควิชาสารสนเทศศึกษา',
          academicYear: `ชั้นปีที่ ${2569 - 2500 - cohort + 1}`,
          advisorName: cohort === 66 ? 'ผศ.วรรณประภา เอี่ยมฤทธิ์' : 'ดร.ธีรเดช มานะกุล',
          phone: `08${cohort}${String(i).padStart(6, '0')}`,
        },
      });
      studentByCode[studentId] = student;
      students.push(student);
      studentRows.push({
        name: student.name,
        studentId: student.studentId,
        cohort: `รุ่น ${cohort}`,
        email: student.email,
        password: PASSWORD_PLAIN,
      });
    }
  }

  // 4.1 เพิ่มบัญชีนิสิต 67020940 (ณภัทร สุขสมบูรณ์) สำหรับทดสอบระบบ
  const studentNaphat = await prisma.user.create({
    data: {
      email: '67020940@go.buu.ac.th',
      password,
      name: 'ณภัทร สุขสมบูรณ์',
      firstName: 'ณภัทร',
      lastName: 'สุขสมบูรณ์',
      role: 'student',
      studentId: '67020940',
      faculty: 'คณะวิทยาการสารสนเทศ',
      major: 'ภาควิชาสารสนเทศศึกษา',
      department: 'ภาควิชาสารสนเทศศึกษา',
      academicYear: 'ชั้นปีที่ 2',
      advisorName: 'ดร.ธีรเดช มานะกุล',
      phone: '0812345678',
      bio: 'นิสิตชั้นปีที่ 2 คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา สนใจด้าน Full-Stack Development และ AI',
    },
  });
  studentByCode['67020940'] = studentNaphat;
  students.push(studentNaphat);
  studentRows.push({
    name: studentNaphat.name,
    studentId: studentNaphat.studentId,
    cohort: 'รุ่น 67',
    email: studentNaphat.email,
    password: PASSWORD_PLAIN,
  });

  // 5. ลงทะเบียนเรียน
  const enrollmentsToCreate = [];
  const seenEnroll = new Set();
  for (const item of ENROLLMENTS_DATA) {
    const student = studentByCode[item.studentId];
    const course = courseByKey[item.courseKey];
    if (student && course) {
      const pair = `${student.id}_${course.id}`;
      if (!seenEnroll.has(pair)) {
        seenEnroll.add(pair);
        enrollmentsToCreate.push({
          studentId: student.id,
          courseId: course.id,
        });
      }
    }
  }

  // ลงทะเบียนรายวิชาให้นิสิต 67020940
  const naphatCourseKeys = [
    '24527364#1/2569#01',
    '24531464#1/2569#01',
    '24537264#1/2569#01',
    '24543164#1/2569#01',
    '24514169#1/2569#01',
    '24515169#1/2569#02',
  ];
  for (const cKey of naphatCourseKeys) {
    const course = courseByKey[cKey];
    if (course) {
      const pair = `${studentNaphat.id}_${course.id}`;
      if (!seenEnroll.has(pair)) {
        seenEnroll.add(pair);
        enrollmentsToCreate.push({
          studentId: studentNaphat.id,
          courseId: course.id,
        });
      }
    }
  }

  if (enrollmentsToCreate.length > 0) {
    await prisma.enrollment.createMany({ data: enrollmentsToCreate });
  }

  // 5.1 สร้างข้อมูลคำร้องขอลาจำลอง (Mock Leave Requests) ครบทุกสถานะและประเภท
  const juthamat = studentByCode['66000001'];
  const naphat = studentByCode['67020940'];
  const kittisak = studentByCode['66000002'];
  const chonthicha = studentByCode['66000003'];

  // หาวิชาหลักสำหรับผูกใบลา
  const courseList = Object.values(courseByKey);
  const course1 = courseByKey['24527364#1/2569#01'] || courseList[0];
  const course2 = courseByKey['24531464#1/2569#01'] || courseList[1];
  const course3 = courseByKey['24537264#1/2569#01'] || courseList[2];
  const course4 = courseByKey['24514169#1/2569#01'] || courseList[3];

  const mockLeaves = [
    // 1. ใบลาของ จุฑามาศ - ลาป่วย (รออนุมัติ) มีรูปภาพแนบ
    {
      studentId: juthamat.id,
      courseId: course1.id,
      type: 'ลาป่วย',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-10-16',
      endDate: '2026-10-17',
      reason: 'มีไข้สูง 38.5 องศา ปวดศีรษะและมีอาการไอ แพทย์ตรวจแล้ววินิจฉัยให้พักผ่อนเป็นเวลา 2 วัน',
      attachment: 'sample-medical-cert.png',
      status: 'รออนุมัติ',
      teacherComment: null,
    },
    // 2. ใบลาของ จุฑามาศ - ลากิจส่วนตัว (อนุมัติแล้ว) มีเอกสารแนบ
    {
      studentId: juthamat.id,
      courseId: course2.id,
      type: 'ลากิจส่วนตัว',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-10-02',
      endDate: '2026-10-02',
      reason: 'ต้องเดินทางไปติดต่อราชการทำบัตรประชาชนและเอกสารสำคัญที่ภูมิลำเนาต่างจังหวัด',
      attachment: 'activity-permission-letter.png',
      status: 'อนุมัติ',
      teacherComment: 'รับทราบ อนุญาตให้ลาได้และอย่าลืมศึกษาเอกสารประกอบการสอนย้อนหลัง',
    },
    // 3. ใบลาของ จุฑามาศ - ลาป่วย (ไม่อนุมัติ) ไม่มีไฟล์แนบ
    {
      studentId: juthamat.id,
      courseId: course3.id,
      type: 'ลาป่วย',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-09-20',
      endDate: '2026-09-20',
      reason: 'ปวดท้องกะทันหัน ไม่สามารถเดินทางมาเรียนได้',
      attachment: null,
      status: 'ไม่อนุมัติ',
      teacherComment: 'กรุณาแนบใบรับรองแพทย์จากสถานพยาบาลประกอบการพิจารณา เนื่องจากขาดเรียนเกินโควต้าที่กำหนด',
    },
    // 4. ใบลาของ ณภัทร (67020940) - ลากิจกรรม (รออนุมัติ) มีรูปแนบ
    {
      studentId: naphat.id,
      courseId: course1.id,
      type: 'ลากิจกรรม',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-10-20',
      endDate: '2026-10-21',
      reason: 'เข้าร่วมการแข่งขันนำเสนอโครงงานนวัตกรรมดิจิทัลระดับอุดมศึกษา ในนามตัวแทนคณะวิทยาการสารสนเทศ',
      attachment: 'sample-activity-cert.png',
      status: 'รออนุมัติ',
      teacherComment: null,
    },
    // 5. ใบลาของ ณภัทร (67020940) - ลาป่วย (อนุมัติแล้ว) แนบไฟล์ PDF
    {
      studentId: naphat.id,
      courseId: course4.id,
      type: 'ลาป่วย',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      reason: 'ประสบอุบัติเหตุทางรถจักรยานยนต์ มีแผลฟกช้ำและแพทย์สั่งให้ล้างแผลที่โรงพยาบาลมหาวิทยาลัยบูรพา',
      attachment: 'sample-medical-certificate.pdf',
      status: 'อนุมัติ',
      teacherComment: 'อนุมัติครับ ขอให้หายไวๆ และระมัดระวังในการเดินทาง',
    },
    // 6. ใบลาของ กิตติศักดิ์ - ลาป่วย (รออนุมัติ)
    {
      studentId: kittisak.id,
      courseId: course1.id,
      type: 'ลาป่วย',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-10-18',
      endDate: '2026-10-19',
      reason: 'อาหารเป็นพิษ คลื่นไส้ อาเจียน ต้องนอนพักสังเกตอาการที่โรงพยาบาล',
      attachment: 'medical-cert-sample.png',
      status: 'รออนุมัติ',
      teacherComment: null,
    },
    // 7. ใบลาของ ชลธิชา - ลากิจส่วนตัว (อนุมัติแล้ว)
    {
      studentId: chonthicha.id,
      courseId: course2.id,
      type: 'ลากิจส่วนตัว',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-09-08',
      endDate: '2026-09-09',
      reason: 'เข้าร่วมพิธีพระราชทานเพลิงศพญาติสนิทที่ต่างจังหวัด',
      attachment: null,
      status: 'อนุมัติ',
      teacherComment: 'อนุมัติ ขอแสดงความเสียใจกับครอบครัวด้วยครับ',
    },
    // 8. ใบลาของ ชลธิชา - ลากิจกรรม (ไม่อนุมัติ)
    {
      studentId: chonthicha.id,
      courseId: course3.id,
      type: 'ลากิจกรรม',
      period: 'เต็มคาบเรียน 3 ชั่วโมง',
      startDate: '2026-08-25',
      endDate: '2026-08-25',
      reason: 'ไปร่วมกิจกรรมสัมมนานอกสถานที่ของชมรม',
      attachment: null,
      status: 'ไม่อนุมัติ',
      teacherComment: 'ไม่อนุมัติ เนื่องจากไม่มีหนังสือขออนุญาตเข้าร่วมกิจกรรมที่ลงนามโดยอาจารย์ที่ปรึกษาโครงการ',
    },
  ];

  for (const l of mockLeaves) {
    const createdLeave = await prisma.leaveRequest.create({ data: l });

    // ถ้าเป็นสถานะ 'รออนุมัติ' ให้ส่ง Notification ไปยังอาจารย์ผู้สอน
    if (l.status === 'รออนุมัติ') {
      const targetCourse = courseList.find((c) => c.id === l.courseId);
      const studentObj = students.find((s) => s.id === l.studentId);
      if (targetCourse?.teacherId) {
        await prisma.notification.create({
          data: {
            userId: targetCourse.teacherId,
            message: `${studentObj?.name || 'นิสิต'} ยื่นคำร้องขอ${l.type} รายวิชา "${targetCourse.name}" (${l.period})`,
            link: '/teacher/requests',
          },
        });
      }
    }
  }

  // 6. user-credentials.xlsx
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BUU Take A Leave';
  workbook.created = new Date();

  function addSheet(name, columns, rows) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns;
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7749BC" } };
    sheet.getRow(1).alignment = { vertical: "middle" };
    return sheet;
  }

  addSheet('แอดมิน', [
    { header: 'ชื่อ-สกุล', key: 'name', width: 28 },
    { header: 'อีเมล (Username)', key: 'email', width: 30 },
    { header: 'รหัสผ่าน', key: 'password', width: 14 },
  ], adminRows);

  addSheet('อาจารย์', [
    { header: 'ชื่อ-สกุล', key: 'name', width: 30 },
    { header: 'อีเมล (Username)', key: 'email', width: 32 },
    { header: 'รหัสผ่าน', key: 'password', width: 12 },
    { header: 'วิชาที่สอน', key: 'subjects', width: 65 },
  ], teacherRowList);

  addSheet('นิสิต', [
    { header: 'ชื่อ-สกุล', key: 'name', width: 24 },
    { header: 'รหัสนิสิต', key: 'studentId', width: 14 },
    { header: 'รุ่น', key: 'cohort', width: 10 },
    { header: 'อีเมล (Username)', key: 'email', width: 30 },
    { header: 'รหัสผ่าน', key: 'password', width: 12 },
  ], studentRows);

  const outPath = path.join(__dirname, '..', 'user-credentials.xlsx');
  await workbook.xlsx.writeFile(outPath);

  console.log('Seed completed successfully!');
  console.log(`- แอดมิน: 1 คน, อาจารย์: ${TEACHERS.length} ท่าน, นิสิต: ${students.length} คน`);
  console.log(`- รายวิชา: ${COURSES.length} กลุ่มเรียน, การลงทะเบียน: ${enrollmentsToCreate.length} รายการ`);
  console.log(`- คำร้องขอลาจำลอง: ${mockLeaves.length} รายการ (รออนุมัติ, อนุมัติ, ไม่อนุมัติ ครบถ้วน)`);
  console.log(`- รหัสผ่านทุกบัญชี: ${PASSWORD_PLAIN}`);
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });