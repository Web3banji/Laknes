/**
 * LAKNES Creator Studio & Partnerships API Routes
 * Handles creator applications, private creator campaigns, content submissions, and brand partnership requests.
 */

import { Router } from 'express';
import { getDatabase } from '../../dal/index.ts';
import { buildSuccessResponse } from '../../core/response.ts';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.ts';
import { ValidationError, ForbiddenError, NotFoundError } from '../../core/errors.ts';
import { sanitizeString } from '../../shared/validation.ts';
import { UserRole } from '../../types/contracts.ts';

const router = Router();

// =========================================================================
// 1. CREATOR APPLICATIONS (Ordinary users applying for Creator Studio)
// =========================================================================

/**
 * Get current user's creator application status
 */
router.get('/me/application', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM creator_applications WHERE user_id = ?').get(req.user!.id) as any;
    if (!row) {
      return res.json(buildSuccessResponse({ status: 'NOT_APPLIED' }));
    }
    res.json(
      buildSuccessResponse({
        id: String(row.id),
        userId: String(row.user_id),
        creatorName: String(row.creator_name),
        email: row.email ? String(row.email) : undefined,
        socialLinks: JSON.parse(String(row.social_links || '{}')),
        contentNiche: String(row.content_niche),
        audienceInfo: row.audience_info ? String(row.audience_info) : undefined,
        portfolioLinks: JSON.parse(String(row.portfolio_links || '[]')),
        strengthsDescription: String(row.strengths_description),
        status: String(row.status),
        adminNotes: row.admin_notes ? String(row.admin_notes) : undefined,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      })
    );
  } catch (error) {
    next(error);
  }
});

/**
 * Submit or resubmit Creator Studio application
 */
router.post('/apply', requireAuth, async (req, res, next) => {
  try {
    const { creatorName, socialLinks, contentNiche, audienceInfo, portfolioLinks, strengthsDescription } = req.body;

    if (!creatorName || String(creatorName).trim().length < 2) {
      throw new ValidationError('Creator name is required (minimum 2 characters).');
    }
    if (!contentNiche || String(contentNiche).trim() === '') {
      throw new ValidationError('Content niche is required.');
    }
    if (!strengthsDescription || String(strengthsDescription).trim().length < 10) {
      throw new ValidationError('Please describe your content strengths and focus (minimum 10 characters).');
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM creator_applications WHERE user_id = ?').get(req.user!.id) as any;

    const normalizedLinks = Array.isArray(portfolioLinks)
      ? portfolioLinks.map((l: string) => String(l).trim()).filter(Boolean)
      : typeof portfolioLinks === 'string'
      ? portfolioLinks.split('\n').map((l) => l.trim()).filter(Boolean)
      : [];

    const normalizedSocial = typeof socialLinks === 'object' && socialLinks !== null ? socialLinks : {};

    if (existing) {
      db.prepare(`
        UPDATE creator_applications
        SET creator_name = ?, social_links = ?, content_niche = ?, audience_info = ?,
            portfolio_links = ?, strengths_description = ?, status = 'PENDING', updated_at = ?
        WHERE id = ?
      `).run(
        sanitizeString(creatorName),
        JSON.stringify(normalizedSocial),
        sanitizeString(contentNiche),
        audienceInfo ? sanitizeString(audienceInfo) : null,
        JSON.stringify(normalizedLinks),
        sanitizeString(strengthsDescription),
        now,
        existing.id
      );
    } else {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO creator_applications (
          id, user_id, creator_name, email, social_links, content_niche,
          audience_info, portfolio_links, strengths_description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `).run(
        id,
        req.user!.id,
        sanitizeString(creatorName),
        req.user!.email,
        JSON.stringify(normalizedSocial),
        sanitizeString(contentNiche),
        audienceInfo ? sanitizeString(audienceInfo) : null,
        JSON.stringify(normalizedLinks),
        sanitizeString(strengthsDescription),
        now,
        now
      );
    }

    const saved = db.prepare('SELECT * FROM creator_applications WHERE user_id = ?').get(req.user!.id) as any;
    res.status(201).json(buildSuccessResponse({
      ...saved,
      socialLinks: JSON.parse(String(saved.social_links || '{}')),
      portfolioLinks: JSON.parse(String(saved.portfolio_links || '[]')),
    }));
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 2. CREATOR CAMPAIGNS (Private access for Approved Creators)
// =========================================================================

/**
/**
 * Get active campaigns for Creator Studio (open to all authenticated users)
 */
router.get('/campaigns', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();

    const rows = db.prepare(`
      SELECT * FROM creator_campaigns
      WHERE status = 'ACTIVE'
      ORDER BY created_at DESC
    `).all() as any[];

    const campaigns = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      brandProjectName: String(r.brand_project_name),
      objective: String(r.objective),
      deliverables: String(r.deliverables),
      targetNiches: JSON.parse(String(r.target_niches || '[]')),
      rewardPool: String(r.reward_pool),
      rewardPerCreator: String(r.reward_per_creator),
      briefGuidelines: String(r.brief_guidelines),
      deadline: r.deadline ? String(r.deadline) : undefined,
      status: String(r.status),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    res.json(buildSuccessResponse(campaigns));
  } catch (error) {
    next(error);
  }
});

/**
 * Get campaign leaderboard based on approved submissions
 */
router.get('/campaigns/:id/leaderboard', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();
    const campaign = db.prepare('SELECT * FROM creator_campaigns WHERE id = ?').get(req.params.id) as any;
    if (!campaign) {
      throw new NotFoundError('CreatorCampaign', req.params.id);
    }

    const isEnded =
      campaign.status === 'COMPLETED' ||
      campaign.status === 'ARCHIVED' ||
      campaign.status === 'ENDED' ||
      (campaign.deadline && !isNaN(Date.parse(campaign.deadline)) && new Date(campaign.deadline) < new Date());

    const rows = db.prepare(`
      SELECT 
        u.id as user_id,
        u.username,
        u.profile_image,
        COUNT(cs.id) as approved_count,
        MAX(cs.reviewed_at) as last_reviewed_at
      FROM creator_campaign_submissions cs
      JOIN users u ON u.id = cs.creator_id
      WHERE cs.campaign_id = ? AND cs.status = 'APPROVED'
      GROUP BY u.id
      ORDER BY approved_count DESC, last_reviewed_at ASC
    `).all(campaign.id) as any[];

    const leaderboard = rows.map((r, index) => ({
      rank: index + 1,
      userId: String(r.user_id),
      username: String(r.username || 'creator'),
      displayName: String(r.username || 'Creator'),
      profileImage: r.profile_image ? String(r.profile_image) : null,
      approvedCount: Number(r.approved_count || 0),
      isWinner: isEnded && index < 3,
    }));

    res.json(buildSuccessResponse({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      status: campaign.status,
      isEnded: Boolean(isEnded),
      leaderboard,
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * Submit content proof for a Creator Studio campaign
 * Open to every authenticated user. Recommended 1 submission per day per campaign.
 */
router.post('/campaigns/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();
    const campaign = db.prepare('SELECT * FROM creator_campaigns WHERE id = ?').get(req.params.id) as any;
    if (!campaign) {
      throw new NotFoundError('CreatorCampaign', req.params.id);
    }

    const { postUrl, submissionLinks, proofNotes } = req.body;
    let links: string[] = [];

    if (postUrl && typeof postUrl === 'string' && postUrl.trim() !== '') {
      links.push(postUrl.trim());
    }

    if (Array.isArray(submissionLinks)) {
      links.push(...submissionLinks.map((s: string) => String(s).trim()).filter(Boolean));
    } else if (typeof submissionLinks === 'string' && submissionLinks.trim() !== '') {
      links.push(...submissionLinks.split('\n').map((s) => s.trim()).filter(Boolean));
    }

    // Deduplicate
    links = Array.from(new Set(links));

    if (links.length === 0) {
      throw new ValidationError('Please provide your published content post URL (e.g. X / Twitter post, video, or article link).');
    }

    // Validate URLs
    for (const link of links) {
      try {
        const parsed = new URL(link);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new ValidationError('Each submission URL must start with http:// or https://');
        }
      } catch {
        throw new ValidationError(`Invalid post URL: "${link}". Please enter a valid web URL.`);
      }
    }

    const now = new Date().toISOString();
    const todayPrefix = now.slice(0, 10); // YYYY-MM-DD

    // Check existing submissions today for advisory notice
    const existingToday = db.prepare(`
      SELECT count(*) as count FROM creator_campaign_submissions
      WHERE campaign_id = ? AND creator_id = ? AND substr(submitted_at, 1, 10) = ?
    `).get(campaign.id, req.user!.id, todayPrefix) as { count: number };

    const dailySubmissionsToday = Number(existingToday?.count || 0);

    const id = crypto.randomUUID();

    // Store every submission in the database with timestamps and status: PENDING
    db.prepare(`
      INSERT INTO creator_campaign_submissions (
        id, campaign_id, creator_id, status, submission_links,
        proof_notes, payout_amount, payout_status, submitted_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'PENDING', ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(
      id,
      campaign.id,
      req.user!.id,
      JSON.stringify(links),
      proofNotes ? sanitizeString(proofNotes) : null,
      campaign.reward_per_creator || null,
      now,
      now,
      now
    );

    const submission = db.prepare('SELECT * FROM creator_campaign_submissions WHERE id = ?').get(id) as any;
    res.status(201).json(buildSuccessResponse({
      ...submission,
      submissionLinks: JSON.parse(String(submission.submission_links || '[]')),
      dailyNotice: dailySubmissionsToday > 0
        ? 'Submission recorded! Note: LAKNES recommends 1 submission per user per day per campaign for optimal review quality.'
        : 'Submission received! It is now pending administrator review.',
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * Get current creator's campaign submissions and earnings tracking
 */
router.get('/me/submissions', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT cs.*, c.title as campaign_title, c.brand_project_name, c.reward_per_creator
      FROM creator_campaign_submissions cs
      JOIN creator_campaigns c ON c.id = cs.campaign_id
      WHERE cs.creator_id = ?
      ORDER BY cs.created_at DESC
    `).all(req.user!.id) as any[];

    const submissions = rows.map((r) => ({
      id: String(r.id),
      campaignId: String(r.campaign_id),
      creatorId: String(r.creator_id),
      campaignTitle: String(r.campaign_title),
      brandProjectName: String(r.brand_project_name),
      status: r.status === 'SUBMITTED' ? 'PENDING' : String(r.status),
      submissionLinks: JSON.parse(String(r.submission_links || '[]')),
      proofNotes: r.proof_notes ? String(r.proof_notes) : undefined,
      revisionFeedback: r.revision_feedback ? String(r.revision_feedback) : undefined,
      payoutAmount: r.payout_amount ? String(r.payout_amount) : String(r.reward_per_creator || 'N/A'),
      payoutStatus: String(r.payout_status),
      submittedAt: r.submitted_at ? String(r.submitted_at) : undefined,
      reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    res.json(buildSuccessResponse(submissions));
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 3. PROJECT PARTNERSHIP REQUESTS (Web3 teams requesting LAKNES distribution)
// =========================================================================

/**
 * Submit a partnership request to LAKNES
 */
router.post('/partnerships', async (req, res, next) => {
  try {
    const { projectName, contactInfo, campaignObjective, requestedService, budgetRange, relevantLinks } = req.body;

    if (!projectName || String(projectName).trim() === '') {
      throw new ValidationError('Project name is required.');
    }
    if (!contactInfo || String(contactInfo).trim() === '') {
      throw new ValidationError('Contact information (Telegram or Email) is required.');
    }
    if (!campaignObjective || String(campaignObjective).trim() === '') {
      throw new ValidationError('Campaign objective is required.');
    }

    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;

    db.prepare(`
      INSERT INTO partnership_requests (
        id, user_id, project_name, contact_info, campaign_objective,
        requested_service, budget_range, relevant_links, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(
      id,
      userId,
      sanitizeString(projectName),
      sanitizeString(contactInfo),
      sanitizeString(campaignObjective),
      sanitizeString(requestedService || 'Curated Creator Distribution'),
      sanitizeString(budgetRange || 'Flexible / To Be Discussed'),
      relevantLinks ? sanitizeString(relevantLinks) : null,
      now,
      now
    );

    const saved = db.prepare('SELECT * FROM partnership_requests WHERE id = ?').get(id) as any;
    res.status(201).json(buildSuccessResponse(saved));
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's submitted partnership requests
 */
router.get('/partnerships/my', requireAuth, async (req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM partnership_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user!.id) as any[];

    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// 4. ADMIN MANAGEMENT FOR CREATOR STUDIO & CAMPAIGNS
// =========================================================================

/**
 * Admin: List creator applications
 */
router.get('/admin/applications', requireAdmin, async (req, res, next) => {
  try {
    const db = getDatabase();
    const status = req.query.status as string;
    let query = `
      SELECT ca.*, u.username, u.profile_image
      FROM creator_applications ca
      JOIN users u ON u.id = ca.user_id
    `;
    const params: any[] = [];
    if (status && status !== 'ALL') {
      query += ' WHERE ca.status = ?';
      params.push(status);
    }
    query += ' ORDER BY ca.created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    const applications = rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      username: String(r.username),
      profileImage: r.profile_image ? String(r.profile_image) : undefined,
      creatorName: String(r.creator_name),
      email: r.email ? String(r.email) : undefined,
      socialLinks: JSON.parse(String(r.social_links || '{}')),
      contentNiche: String(r.content_niche),
      audienceInfo: r.audience_info ? String(r.audience_info) : undefined,
      portfolioLinks: JSON.parse(String(r.portfolio_links || '[]')),
      strengthsDescription: String(r.strengths_description),
      status: String(r.status),
      adminNotes: r.admin_notes ? String(r.admin_notes) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    res.json(buildSuccessResponse(applications));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: Review Creator Studio application (APPROVE / REJECT)
 */
router.post('/admin/applications/:id/review', requireAdmin, async (req, res, next) => {
  try {
    const { decision, adminNotes } = req.body;
    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      throw new ValidationError("Decision must be 'APPROVED' or 'REJECTED'.");
    }

    const db = getDatabase();
    const app = db.prepare('SELECT * FROM creator_applications WHERE id = ?').get(req.params.id) as any;
    if (!app) {
      throw new NotFoundError('CreatorApplication', req.params.id);
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE creator_applications
      SET status = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(decision, adminNotes ? sanitizeString(adminNotes) : null, now, req.params.id);

    // If approved, add CREATOR role to the user's role list if not present
    if (decision === 'APPROVED') {
      const user = db.prepare('SELECT roles FROM users WHERE id = ?').get(app.user_id) as any;
      if (user) {
        const roles: string[] = JSON.parse(String(user.roles || '["USER"]'));
        if (!roles.includes(UserRole.CREATOR)) {
          roles.push(UserRole.CREATOR);
          db.prepare('UPDATE users SET roles = ?, updated_at = ? WHERE id = ?').run(
            JSON.stringify(roles),
            now,
            app.user_id
          );
        }
      }
    }

    const updated = db.prepare('SELECT * FROM creator_applications WHERE id = ?').get(req.params.id) as any;
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: List all Creator Studio campaigns
 */
router.get('/admin/campaigns', requireAdmin, async (_req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM creator_campaigns ORDER BY created_at DESC').all() as any[];
    const campaigns = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      brandProjectName: String(r.brand_project_name),
      objective: String(r.objective),
      deliverables: String(r.deliverables),
      targetNiches: JSON.parse(String(r.target_niches || '[]')),
      rewardPool: String(r.reward_pool),
      rewardPerCreator: String(r.reward_per_creator),
      briefGuidelines: String(r.brief_guidelines),
      deadline: r.deadline ? String(r.deadline) : undefined,
      status: String(r.status),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
    res.json(buildSuccessResponse(campaigns));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: Create a new Creator Studio campaign
 */
router.post('/admin/campaigns', requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      brandProjectName,
      objective,
      deliverables,
      targetNiches,
      rewardPool,
      rewardPerCreator,
      briefGuidelines,
      deadline,
    } = req.body;

    if (!title || !brandProjectName || !objective || !deliverables) {
      throw new ValidationError('Campaign title, brand/project partner, objective, and deliverables are required.');
    }

    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const niches = Array.isArray(targetNiches)
      ? targetNiches
      : typeof targetNiches === 'string'
      ? targetNiches.split(',').map((s) => s.trim()).filter(Boolean)
      : ['General Web3'];

    db.prepare(`
      INSERT INTO creator_campaigns (
        id, title, brand_project_name, objective, deliverables,
        target_niches, reward_pool, reward_per_creator, brief_guidelines,
        deadline, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      id,
      sanitizeString(title),
      sanitizeString(brandProjectName),
      sanitizeString(objective),
      sanitizeString(deliverables),
      JSON.stringify(niches),
      sanitizeString(rewardPool || '$1,000 USDC'),
      sanitizeString(rewardPerCreator || '$250 USDC'),
      sanitizeString(briefGuidelines || 'Follow official branding and disclosure guidelines.'),
      deadline || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM creator_campaigns WHERE id = ?').get(id) as any;
    res.status(201).json(buildSuccessResponse(created));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: Update campaign status (ACTIVE, COMPLETED, ARCHIVED)
 */
router.patch('/admin/campaigns/:id', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE creator_campaigns SET status = ?, updated_at = ? WHERE id = ?').run(
      status,
      now,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM creator_campaigns WHERE id = ?').get(req.params.id);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: List creator campaign submissions
 */
router.get('/admin/submissions', requireAdmin, async (_req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT cs.*, c.title as campaign_title, c.brand_project_name, u.username as creator_username, u.email as creator_email
      FROM creator_campaign_submissions cs
      JOIN creator_campaigns c ON c.id = cs.campaign_id
      JOIN users u ON u.id = cs.creator_id
      ORDER BY cs.created_at DESC
    `).all() as any[];

    const submissions = rows.map((r) => ({
      id: String(r.id),
      campaignId: String(r.campaign_id),
      creatorId: String(r.creator_id),
      creatorUsername: String(r.creator_username),
      creatorEmail: String(r.creator_email),
      campaignTitle: String(r.campaign_title),
      brandProjectName: String(r.brand_project_name),
      status: String(r.status),
      submissionLinks: JSON.parse(String(r.submission_links || '[]')),
      proofNotes: r.proof_notes ? String(r.proof_notes) : undefined,
      revisionFeedback: r.revision_feedback ? String(r.revision_feedback) : undefined,
      payoutAmount: r.payout_amount ? String(r.payout_amount) : undefined,
      payoutStatus: String(r.payout_status),
      submittedAt: r.submitted_at ? String(r.submitted_at) : undefined,
      reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    res.json(buildSuccessResponse(submissions));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: Review creator submission (APPROVE, REVISION_REQUESTED, REJECT)
 */
router.post('/admin/submissions/:id/review', requireAdmin, async (req, res, next) => {
  try {
    const { decision, feedback, payoutAmount } = req.body;
    if (!['APPROVED', 'REVISION_REQUESTED', 'REJECTED'].includes(decision)) {
      throw new ValidationError("Decision must be 'APPROVED', 'REVISION_REQUESTED', or 'REJECTED'.");
    }

    const db = getDatabase();
    const sub = db.prepare('SELECT * FROM creator_campaign_submissions WHERE id = ?').get(req.params.id) as any;
    if (!sub) {
      throw new NotFoundError('CreatorCampaignSubmission', req.params.id);
    }

    const now = new Date().toISOString();
    const payoutStatus = decision === 'APPROVED' ? 'AWARDED' : sub.payout_status;

    db.prepare(`
      UPDATE creator_campaign_submissions
      SET status = ?, revision_feedback = ?, payout_amount = COALESCE(?, payout_amount),
          payout_status = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      decision,
      feedback ? sanitizeString(feedback) : null,
      payoutAmount ? sanitizeString(payoutAmount) : null,
      payoutStatus,
      now,
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM creator_campaign_submissions WHERE id = ?').get(req.params.id);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: List partnership requests
 */
router.get('/admin/partnerships', requireAdmin, async (_req, res, next) => {
  try {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM partnership_requests ORDER BY created_at DESC').all() as any[];
    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});

/**
 * Admin: Update partnership request status
 */
router.patch('/admin/partnerships/:id', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE partnership_requests
      SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes), updated_at = ?
      WHERE id = ?
    `).run(status || null, adminNotes ? sanitizeString(adminNotes) : null, now, req.params.id);
    const updated = db.prepare('SELECT * FROM partnership_requests WHERE id = ?').get(req.params.id);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});

export const creatorRoutes = router;
