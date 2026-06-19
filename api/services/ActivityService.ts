import { activityRepository } from '../repositories/ActivityRepository.ts';
import type { Activity, ActivityStats } from '../../shared/types.ts';

export class ActivityService {
  getActivities(status?: Activity['status']): Activity[] {
    return activityRepository.findAll(status);
  }

  getActivity(id: string): Activity | undefined {
    return activityRepository.findById(id);
  }

  createActivity(data: Omit<Activity, 'id' | 'createdAt'>): Activity {
    return activityRepository.create(data);
  }

  updateActivity(id: string, updates: Partial<Omit<Activity, 'id' | 'createdAt'>>): void {
    activityRepository.update(id, updates);
  }

  getActivityStats(activityId: string): ActivityStats | undefined {
    return activityRepository.getStats(activityId);
  }
}

export const activityService = new ActivityService();
