import { Router } from 'express';
import { activityService } from '../services/ActivityService.ts';
import type { Activity } from '../../shared/types.ts';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  const activities = activityService.getActivities(
    status as Activity['status'] | undefined
  );
  res.json(activities);
});

router.get('/:id', (req, res) => {
  const activity = activityService.getActivity(req.params.id);
  if (!activity) {
    res.status(404).json({ error: '活动不存在' });
    return;
  }
  res.json(activity);
});

router.post('/', (req, res) => {
  try {
    const activity = activityService.createActivity(req.body);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/:id', (req, res) => {
  try {
    activityService.updateActivity(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/:id/stats', (req, res) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
  const stats = activityService.getActivityStats(req.params.id, days);
  if (!stats) {
    res.status(404).json({ error: '活动统计数据不存在' });
    return;
  }
  res.json(stats);
});

export default router;
