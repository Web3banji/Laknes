/**
 * LAKNES Quest API Routes
 */

import { Router } from 'express';
import { questService } from '../../modules/quest/quest.service.ts';
import { questParticipationService } from '../../modules/quest/participation.service.ts';
import { buildSuccessResponse } from '../../core/response.ts';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await questService.getActiveQuests(req.query);
    res.json(buildSuccessResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const quest = await questService.getQuestById(req.params.id);
    res.json(buildSuccessResponse(quest));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/join', requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.joinQuest(req.user!, req.params.id);
    res.status(201).json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.submitProof(
      req.user!,
      req.params.id,
      req.body.submissionProof
    );
    res.json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/verify', requireAuth, async (req, res, next) => {
  try {
    const participation = await questParticipationService.verifyCompletion(
      req.user!,
      req.params.id,
      req.body.decision,
      req.body.verificationNotes
    );
    res.json(buildSuccessResponse(participation));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const { getDatabase } = await import('../../dal/index.ts');
    const db = getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      db.prepare('INSERT INTO saved_quests (id, user_id, quest_id, created_at) VALUES (?, ?, ?, ?)').run(
        id,
        req.user!.id,
        req.params.id,
        now
      );
    } catch {
      // Ignore unique constraint if already saved
    }
    res.json(buildSuccessResponse({ saved: true }));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const { getDatabase } = await import('../../dal/index.ts');
    const db = getDatabase();
    db.prepare('DELETE FROM saved_quests WHERE user_id = ? AND quest_id = ?').run(
      req.user!.id,
      req.params.id
    );
    res.json(buildSuccessResponse({ saved: false }));
  } catch (error) {
    next(error);
  }
});

// Admin Quest Management & Stack Approval
router.get('/admin/pending-completions', requireAdmin, async (_req, res, next) => {
  try {
    const { getDatabase } = await import('../../dal/index.ts');
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT qp.*, q.title as quest_title, q.project_id, p.name as project_name, u.username, u.email
      FROM quest_participations qp
      JOIN quests q ON q.id = qp.quest_id
      JOIN projects p ON p.id = q.project_id
      JOIN users u ON u.id = qp.user_id
      WHERE qp.verification_status = 'PENDING_VERIFICATION' OR qp.completion_status = 'PENDING_VERIFICATION'
      ORDER BY qp.completed_at DESC
    `).all();
    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    const { getDatabase } = await import('../../dal/index.ts');
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT q.*, p.name as project_name, p.logo_url as project_logo
      FROM quests q
      JOIN projects p ON p.id = q.project_id
      ORDER BY q.created_at DESC
    `).all();
    res.json(buildSuccessResponse(rows));
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { getDatabase } = await import('../../dal/index.ts');
    const db = getDatabase();
    const { publicationStatus } = req.body;
    db.prepare('UPDATE quests SET publication_status = ?, updated_at = ? WHERE id = ?').run(
      publicationStatus || 'PUBLISHED',
      new Date().toISOString(),
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM quests WHERE id = ?').get(req.params.id);
    res.json(buildSuccessResponse(updated));
  } catch (error) {
    next(error);
  }
});

export const questRoutes = router;
