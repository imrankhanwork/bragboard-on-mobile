// src/utils/userMap.ts
import { User } from "../types";

export type UserMap = Record<number, User>;

export function buildUserMap(users: User[]): UserMap {
  const map: UserMap = {};
  for (const user of users) {
    map[user.user_id] = user;
  }
  return map;
}
