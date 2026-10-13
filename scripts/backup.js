#!/usr/bin/env node
/**
 * BUU Take A Leave - Automated Database & Uploads Backup Script
 * Usage: node scripts/backup.js [output_directory]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT_DIR, 'prisma', 'dev.db');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DEFAULT_BACKUP_DIR = path.join(ROOT_DIR, 'backups');

const targetBackupDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BACKUP_DIR;

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

async function runBackup() {
  console.log('📦 Starting BUU Take A Leave Backup Process...');
  console.log(`📁 Target directory: ${targetBackupDir}`);

  if (!fs.existsSync(targetBackupDir)) {
    fs.mkdirSync(targetBackupDir, { recursive: true });
  }

  const timestamp = getTimestamp();
  const backupFolder = path.join(targetBackupDir, `backup_${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  // 1. Backup SQLite Database
  if (fs.existsSync(DB_FILE)) {
    const destDb = path.join(backupFolder, 'dev.db');
    fs.copyFileSync(DB_FILE, destDb);
    const size = (fs.statSync(destDb).size / 1024).toFixed(2);
    console.log(`✅ Backed up SQLite database -> ${destDb} (${size} KB)`);
  } else {
    console.warn(`⚠️ SQLite database file not found at ${DB_FILE}`);
  }

  // 2. Backup Uploaded Attachments
  if (fs.existsSync(UPLOADS_DIR)) {
    const destUploads = path.join(backupFolder, 'uploads');
    fs.cpSync(UPLOADS_DIR, destUploads, { recursive: true });
    console.log(`✅ Backed up Uploaded attachments -> ${destUploads}`);
  } else {
    console.log(`ℹ️ No local uploads directory found to backup.`);
  }

  // 3. Create Manifest
  const manifest = {
    system: 'BUU Take A Leave',
    backupAt: new Date().toISOString(),
    files: fs.readdirSync(backupFolder),
  };
  fs.writeFileSync(path.join(backupFolder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`🎉 Backup completed successfully in: ${backupFolder}\n`);
}

runBackup().catch((err) => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
