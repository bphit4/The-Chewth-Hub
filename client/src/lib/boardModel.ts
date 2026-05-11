export const BOARD_ADMIN_USERNAME = "TheChewth";
export const BOARD_ADMIN_EMAIL = "thechewth@thechewth.local";

export type BoardRole = "owner" | "admin" | "moderator" | "member";
export type BoardUserStatus = "active" | "timeout" | "banned" | "deleted";

export type BoardProfile = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: BoardRole;
  status: BoardUserStatus;
  timeoutUntil?: any;
  createdAt?: any;
  updatedAt?: any;
  lastSeenAt?: any;
};

export const BOARD_ROLE_LABELS: Record<BoardRole, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
};

export const BOARD_STATUS_LABELS: Record<BoardUserStatus, string> = {
  active: "Active",
  timeout: "Timed out",
  banned: "Banned",
  deleted: "Deleted",
};

export const BOARD_ROLE_ABILITIES: Record<BoardRole, string[]> = {
  owner: [
    "Full board control",
    "Grant or remove admin and moderator roles",
    "Ban, timeout, restore, or delete board users",
    "Pin, lock, restore, and remove threads or replies",
  ],
  admin: [
    "Manage moderators and members",
    "Ban, timeout, restore, or delete non-owner users",
    "Pin, lock, restore, and remove threads or replies",
  ],
  moderator: [
    "Timeout or ban regular members",
    "Pin, lock, restore, and remove threads or replies",
  ],
  member: [
    "Create threads",
    "Reply to unlocked threads",
    "Edit or remove their own posts",
  ],
};

export type BoardCategory = {
  id: string;
  name: string;
  description: string;
};

export const BOARD_CATEGORIES: BoardCategory[] = [
  { id: "general", name: "General", description: "Anything on your mind around The Chewth community." },
  { id: "nfl", name: "NFL", description: "NFL talk, game threads, trades, draft, and weekly chaos." },
  { id: "nba", name: "NBA", description: "NBA games, standings, rumors, and arguments with receipts." },
  { id: "college", name: "College Sports", description: "NCAAF, NCAAM, Notre Dame, IU, and the Saturday slate." },
  { id: "mlb", name: "MLB", description: "MLB, Reds talk, standings, and daily baseball chatter." },
  { id: "mma", name: "MMA", description: "UFC cards, fighters, rankings, and fight-night discussion." },
];

type UserLike = {
  email?: string | null;
  uid?: string | null;
};

type PostLike = {
  authorId?: string | null;
};

type ValidationResult =
  | { ok: true; title: string; body: string; categoryId: string }
  | { ok: false; error: string };

type PostValidationResult =
  | { ok: true; body: string }
  | { ok: false; error: string };

export function isBoardAdmin(user: UserLike | null | undefined) {
  return (user?.email ?? "").trim().toLowerCase() === BOARD_ADMIN_EMAIL;
}

export function isOwnerProfile(profile: Pick<BoardProfile, "email" | "role"> | null | undefined) {
  return profile?.role === "owner" || (profile?.email ?? "").trim().toLowerCase() === BOARD_ADMIN_EMAIL;
}

export function roleRank(role: BoardRole | null | undefined) {
  if (role === "owner") return 4;
  if (role === "admin") return 3;
  if (role === "moderator") return 2;
  return 1;
}

export function canModerate(profile: Pick<BoardProfile, "role" | "status"> | null | undefined) {
  return profile?.status !== "banned" && profile?.status !== "deleted" && roleRank(profile?.role) >= roleRank("moderator");
}

export function canManageUsers(profile: Pick<BoardProfile, "role" | "status"> | null | undefined) {
  return profile?.status !== "banned" && profile?.status !== "deleted" && roleRank(profile?.role) >= roleRank("admin");
}

export function canManageProfile(
  actor: Pick<BoardProfile, "uid" | "role" | "status"> | null | undefined,
  target: Pick<BoardProfile, "uid" | "role"> | null | undefined,
) {
  if (!actor || !target || actor.uid === target.uid) return false;
  return canManageUsers(actor) && roleRank(actor.role) > roleRank(target.role);
}

export function isTimedOut(profile: Pick<BoardProfile, "status" | "timeoutUntil"> | null | undefined, now = new Date()) {
  if (profile?.status !== "timeout") return false;
  const timeoutDate = profile.timeoutUntil?.toDate ? profile.timeoutUntil.toDate() : profile.timeoutUntil ? new Date(profile.timeoutUntil) : null;
  return Boolean(timeoutDate && timeoutDate.getTime() > now.getTime());
}

export function getBoardBlockReason(profile: Pick<BoardProfile, "status" | "timeoutUntil"> | null | undefined, now = new Date()) {
  if (!profile) return null;
  if (profile.status === "banned") return "Your board account is banned.";
  if (profile.status === "deleted") return "Your board account has been disabled.";
  if (isTimedOut(profile, now)) return "Your board account is timed out.";
  return null;
}

export function getInitialBoardRole(user: UserLike | null | undefined): BoardRole {
  return isBoardAdmin(user) ? "owner" : "member";
}

export function normalizeBoardText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateThreadInput(title: string, body: string, categoryId: string): ValidationResult {
  const normalizedTitle = normalizeBoardText(title).replace(/\n/g, " ");
  const normalizedBody = normalizeBoardText(body);
  const category = BOARD_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return { ok: false, error: "Choose a valid board category." };
  if (normalizedTitle.length < 4) return { ok: false, error: "Thread title must be at least 4 characters." };
  if (normalizedTitle.length > 120) return { ok: false, error: "Thread title must be 120 characters or less." };
  if (normalizedBody.length < 4) return { ok: false, error: "Thread body must be at least 4 characters." };
  if (normalizedBody.length > 8000) return { ok: false, error: "Thread body must be 8,000 characters or less." };
  return { ok: true, title: normalizedTitle, body: normalizedBody, categoryId: category.id };
}

export function validatePostBody(body: string): PostValidationResult {
  const normalizedBody = normalizeBoardText(body);
  if (normalizedBody.length < 4) return { ok: false, error: "Reply must be at least 4 characters." };
  if (normalizedBody.length > 8000) return { ok: false, error: "Reply must be 8,000 characters or less." };
  return { ok: true, body: normalizedBody };
}

export function canEditPost(userId: string | null | undefined, post: PostLike, admin = false) {
  return Boolean(admin || (userId && post.authorId === userId));
}
