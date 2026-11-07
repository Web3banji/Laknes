import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table - Stores all accounts and Google-authenticated identities in Cloud SQL
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / local unique identifier
  email: text('email').notNull(),
  username: text('username').notNull(),
  profileImage: text('profile_image'),
  headerImage: text('header_image'),
  bio: text('bio'),
  roles: text('roles').default('["USER"]'), // JSON array of roles e.g. ["USER"] or ["PROJECT_REPRESENTATIVE"] or ["ADMIN"]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Projects Table - Real registered protocols
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  shortDescription: text('short_description').notNull(),
  description: text('description').notNull(),
  websiteUrl: text('website_url').notNull(),
  documentationUrl: text('documentation_url'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  socialLinks: text('social_links'), // JSON object string
  contractAddresses: text('contract_addresses'), // JSON array string
  supportingInfo: text('supporting_info'),
  ecosystem: text('ecosystem').default('Elysium'),
  verificationStatus: text('verification_status').default('PENDING_REVIEW'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Project Memberships
export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // OWNER, ADMIN, CONTRIBUTOR
  joinedAt: timestamp('joined_at').defaultNow(),
});

// 4. Quests Table - Real protocol quest stacks
export const quests = pgTable('quests', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions'),
  questType: text('quest_type').default('COMMUNITY'),
  rewardConfiguration: text('reward_configuration'), // JSON string
  publicationStatus: text('publication_status').default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Quest Participations & Proofs
export const questParticipations = pgTable('quest_participations', {
  id: text('id').primaryKey(),
  questId: text('quest_id').notNull(),
  userId: text('user_id').notNull(),
  participationStatus: text('participation_status').default('IN_PROGRESS'),
  completionStatus: text('completion_status').default('NOT_STARTED'),
  submissionProof: text('submission_proof'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// 6. User Social Engagements: Project Follows
export const projectFollows = pgTable('project_follows', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  projectId: text('project_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Saved Projects
export const savedProjects = pgTable('saved_projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  projectId: text('project_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Saved Quests
export const savedQuests = pgTable('saved_quests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  questId: text('quest_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Content Moderation Reports
export const contentReports = pgTable('content_reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  reportStatus: text('report_status').default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Immutable Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});
