import { Router } from 'express';
import { collaborationService } from '../services/CollaborationService.ts';
import type { CollaborationRequest } from '../../shared/types.ts';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  const requests = collaborationService.getRequests(
    status as CollaborationRequest['status'] | undefined
  );
  res.json(requests);
});

router.get('/:id', (req, res) => {
  const request = collaborationService.getRequest(req.params.id);
  if (!request) {
    res.status(404).json({ error: '协同请求不存在' });
    return;
  }
  res.json(request);
});

router.post('/', (req, res) => {
  try {
    const request = collaborationService.createRequest(req.body);
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.put('/:id/reply', (req, res) => {
  try {
    const { replyType, replyNote } = req.body;
    collaborationService.replyToRequest(req.params.id, replyType, replyNote);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
