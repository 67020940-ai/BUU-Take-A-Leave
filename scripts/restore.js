#!/usr/bin/env node
/**
 * BUU Take A Leave - Database & Uploads Restore Script
 * Usage: node scripts/restore.js <backup_folder_path>
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT_DIR, 'prisma', 'dev.db');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

const backupFolder = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (!backupFolder || !fs.existsSync(backupFolder)) {
  console.error('❌ Please specify a valid backup folder path.');
  console.error('Usage: node scripts/restore.js backups/backup_YYYYMMDD_HHMMSS');
  process.exit(1);
}

console.log(`🔄 Restoring from: ${backupFolder}`);

const backupDb = path.join(backupFolder, 'dev.db');
if (fs.existsSync(backupDb)) {
  fs.copyFileSync(backupDb, DB_FILE);
  console.log(`✅ Restored database -> ${DB_FILE}`);
} else {
  console.warn(`⚠️ No dev.db found in backup folder.`);
}

const backupUploads = path.join(backupFolder, 'uploads');
if (fs.existsSync(backupUploads)) {
  fs.cpSync(backupUploads, UPLOADS_DIR, { recursive: true });
  console.log(`✅ Restored attachments -> ${UPLOADS_DIR}`);
}

console.log('🎉 Restore completed successfully!');
