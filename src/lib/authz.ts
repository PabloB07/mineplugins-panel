import { UserRole } from "@prisma/client";

export function isAdminRole(role: UserRole | string | undefined | null): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}
