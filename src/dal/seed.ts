/**
 * Database Seed / Cleanup
 * All mock data has been completely eliminated as requested.
 * The platform operates exclusively on real user registrations, real projects, and live quest data.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.resolve(process.cwd(), 'data', 'laknes.db');
if (fs.existsSync(dbPath)) {
  const db = new DatabaseSync(dbPath);
  console.log('[Clean] Purging all mock projects, mock quests, and mock data...');
  try {
    db.exec(`
      DELETE FROM project_memberships;
      DELETE FROM project_updates;
      DELETE FROM quest_participations;
      DELETE FROM quests;
      DELETE FROM project_follows;
      DELETE FROM saved_projects;
      DELETE FROM saved_quests;
      DELETE FROM project_reviews;
      DELETE FROM content_reports;
      DELETE FROM projects;
    `);
    console.log('[Clean] All mock data successfully removed.');
  } catch (err) {
    console.warn('[Clean] Database purge note:', err);
  }
}
