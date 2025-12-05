import { Injectable } from '@angular/core';
import { CrudService, Operator } from '@appstrax/services/database';
import { Like } from '@models';

@Injectable({ providedIn: 'root' })
export class LikeService extends CrudService<Like> {
  constructor() {
    super('feature-likes', Like);
  }

  public async getTallies(keys: string[]): Promise<Record<string, number>> {
    if (!keys?.length) return {};
    const res = await this.find({ where: { itemKey: { [Operator.IN]: keys } } as any });
    const items = (res?.data ?? []) as Like[];
    const tallies: Record<string, number> = {};
    for (const key of keys) tallies[key] = 0;
    for (const like of items) {
      const k = (like as any).itemKey;
      const v = (like as any).value ?? 0;
      if (typeof k === 'string' && (v === 1 || v === -1)) {
        tallies[k] = (tallies[k] ?? 0) + v;
      }
    }
    return tallies;
  }
}


