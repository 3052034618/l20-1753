import { collaborationRepository } from '../repositories/CollaborationRepository.ts';
import type { CollaborationRequest } from '../../shared/types.ts';

export class CollaborationService {
  getRequests(status?: CollaborationRequest['status']): CollaborationRequest[] {
    return collaborationRepository.findAll(status);
  }

  getRequest(id: string): CollaborationRequest | undefined {
    return collaborationRepository.findById(id);
  }

  createRequest(data: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'>): CollaborationRequest {
    return collaborationRepository.create(data);
  }

  replyToRequest(id: string, replyType: CollaborationRequest['replyType'], replyNote?: string): void {
    if (!replyType) {
      throw new Error('回复类型不能为空');
    }
    collaborationRepository.reply(id, replyType, replyNote);
  }
}

export const collaborationService = new CollaborationService();
