#!/usr/bin/env node
/**
 * BUU Take A Leave - Safe Test Data Reset Script
 * Resets:
 *  - LeaveRequest (18 rows -> 0)
 *  - Ticket (7 rows -> 0)
 *  - Notification (26 rows -> 0)
 * 
 * Preserves 100%:
 *  - User (42 accounts)
 *  - Course (55 courses)
 *  - Enrollment (422 records)
 *  - TeachingMaterial (4 records)
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

async function main() {
  console.log('🔄 Starting BUU Take A Leave Test Data Reset...\n');

  // 1. Initial State Verification
  const initialCounts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    enrollments: await prisma.enrollment.count(),
    materials: await prisma.teachingMaterial.count(),
    leaves: await prisma.leaveRequest.count(),
    tickets: await prisma.ticket.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('📊 Current Record Counts:');
  console.log(` - Users (Preserve):             ${initialCounts.users}`);
  console.log(` - Courses (Preserve):           ${initialCounts.courses}`);
  console.log(` - Enrollments (Preserve):       ${initialCounts.enrollments}`);
  console.log(` - TeachingMaterials (Preserve): ${initialCounts.materials}`);
  console.log(` - LeaveRequests (To Reset):     ${initialCounts.leaves}`);
  console.log(` - Tickets (To Reset):           ${initialCounts.tickets}`);
  console.log(` - Notifications (To Reset):     ${initialCounts.notifications}\n`);

  // 2. Safety Backup
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'backups', `reset_backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupData = {
    timestamp: new Date().toISOString(),
    initialCounts,
    leaves: await prisma.leaveRequest.findMany(),
    tickets: await prisma.ticket.findMany(),
    notifications: await prisma.notification.findMany(),
  };

  const backupFilePath = path.join(backupDir, 'pre_reset_data.json');
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`💾 Safety backup created at: ${backupFilePath} (${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB)\n`);

  // 3. Delete Test Data
  console.log('🧹 Clearing test transaction records...');
  
  const deletedLeaves = await prisma.leaveRequest.deleteMany({});
  console.log(` ✅ Deleted ${deletedLeaves.count} leave request(s)`);

  const deletedTickets = await prisma.ticket.deleteMany({});
  console.log(` ✅ Deleted ${deletedTickets.count} ticket(s)`);

  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(` ✅ Deleted ${deletedNotifications.count} notification(s)\n`);

  // 4. Final State Verification
  const finalCounts = {
    users: await prisma.user.count(),
    courses: await prisma.course.count(),
    enrollments: await prisma.enrollment.count(),
    materials: await prisma.teachingMaterial.count(),
    leaves: await prisma.leaveRequest.count(),
    tickets: await prisma.ticket.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('✨ Post-Reset Verification:');
  console.log(` - Users:             ${finalCounts.users} (Expected: ${initialCounts.users})`);
  console.log(` - Courses:           ${finalCounts.courses} (Expected: ${initialCounts.courses})`);
  console.log(` - Enrollments:       ${finalCounts.enrollments} (Expected: ${initialCounts.enrollments})`);
  console.log(` - TeachingMaterials: ${finalCounts.materials} (Expected: ${initialCounts.materials})`);
  console.log(` - LeaveRequests:     ${finalCounts.leaves} (Expected: 0)`);
  console.log(` - Tickets:           ${finalCounts.tickets} (Expected: 0)`);
  console.log(` - Notifications:     ${finalCounts.notifications} (Expected: 0)\n`);

  if (
    finalCounts.users === initialCounts.users &&
    finalCounts.courses === initialCounts.courses &&
    finalCounts.enrollments === initialCounts.enrollments &&
    finalCounts.materials === initialCounts.materials &&
    finalCounts.leaves === 0 &&
    finalCounts.tickets === 0 &&
    finalCounts.notifications === 0
  ) {
    console.log('🎉 Reset completed successfully and verified 100% safe!');
  } else {
    console.error('⚠️ Verification mismatch detected!');
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error('❌ Reset error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
