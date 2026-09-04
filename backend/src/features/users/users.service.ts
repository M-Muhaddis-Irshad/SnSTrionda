// =============================================================================
// Users Feature — Business Logic Service (admin user management)
// =============================================================================
// NOTE: the User model has NO isActive/isBanned field, so disable/enable is
// intentionally NOT implemented here — that needs a schema decision first.
// The password hash column is named `password` — it is NEVER selected in any
// query in this file.
// =============================================================================

import { prisma } from "../../db";

export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

export class UsersError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "UsersError";
  }
}

// ---------------------------------------------------------------------------
// Safe select — every field except password
// ---------------------------------------------------------------------------

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ---------------------------------------------------------------------------
// List (paginated, role + search filters)
// ---------------------------------------------------------------------------

export interface ListUsersParams {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

export async function listUsers(params: ListUsersParams) {
  const { page, limit, role, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (role) {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        ...USER_SAFE_SELECT,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Profile (with lightweight order summary)
// ---------------------------------------------------------------------------

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_SAFE_SELECT,
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new UsersError("User not found", 404);
  }

  return user;
}

// ---------------------------------------------------------------------------
// Role change (with self-demotion guard)
// ---------------------------------------------------------------------------

export async function changeUserRole(actorId: string | undefined, userId: string, role: UserRoleValue) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new UsersError("User not found", 404);
  }

  // An admin must never be able to demote themselves — prevents accidental
  // self-lockout (the only path to losing the last admin would be another
  // admin doing it deliberately).
  if (actorId && actorId === userId && role !== "ADMIN") {
    throw new UsersError("You cannot remove your own ADMIN role.", 400);
  }

  if (user.role === role) {
    // No-op — still return a clean success so the UI can refetch safely.
    const unchanged = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SAFE_SELECT,
    });
    return { user: unchanged, fromRole: user.role };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: USER_SAFE_SELECT,
  });

  return { user: updated, fromRole: user.role };
}
