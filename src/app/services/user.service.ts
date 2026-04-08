import { Injectable } from '@angular/core';
import { appstraxUsers, Operator } from '@appstrax/services/auth';

import { User } from '@models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  async findByUserIds(userIds: string[]): Promise<User[]> {
    const res = await appstraxUsers.find({
      where: { id: { [Operator.IN]: userIds } },
    });
    return (res.data ?? []).map((x) => User.fromAuthUser(x));
  }

  async fetchUsers(): Promise<User[]> {
    const res = await appstraxUsers.find({});
    return (res.data ?? []).map((x) => User.fromAuthUser(x));
  }
}
