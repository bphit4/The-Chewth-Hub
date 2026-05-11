import assert from "node:assert/strict";
import {
  BOARD_ADMIN_EMAIL,
  BOARD_ADMIN_USERNAME,
  BOARD_CATEGORIES,
  canManageProfile,
  canManageUsers,
  canModerate,
  canEditPost,
  getBoardBlockReason,
  getInitialBoardRole,
  isBoardAdmin,
  isTimedOut,
  normalizeBoardText,
  validatePostBody,
  validateThreadInput,
} from "./boardModel";

function run() {
  assert.equal(BOARD_ADMIN_USERNAME, "TheChewth");
  assert.equal(BOARD_ADMIN_EMAIL, "thechewth@thechewth.local");
  assert.ok(isBoardAdmin({ email: "thechewth@thechewth.local" }));
  assert.ok(isBoardAdmin({ email: "TheChewth@TheChewth.Local" }));
  assert.equal(isBoardAdmin({ email: "fan@example.com" }), false);
  assert.equal(getInitialBoardRole({ email: "thechewth@thechewth.local" }), "owner");
  assert.equal(getInitialBoardRole({ email: "fan@example.com" }), "member");

  const owner = { uid: "owner", role: "owner" as const, status: "active" as const };
  const admin = { uid: "admin", role: "admin" as const, status: "active" as const };
  const moderator = { uid: "mod", role: "moderator" as const, status: "active" as const };
  const member = { uid: "member", role: "member" as const, status: "active" as const };
  assert.equal(canModerate(moderator), true);
  assert.equal(canManageUsers(admin), true);
  assert.equal(canManageUsers(moderator), false);
  assert.equal(canManageProfile(owner, admin), true);
  assert.equal(canManageProfile(admin, moderator), true);
  assert.equal(canManageProfile(admin, owner), false);
  assert.equal(canManageProfile(admin, admin), false);
  assert.equal(canModerate({ ...moderator, status: "banned" }), false);
  assert.equal(canModerate(member), false);
  assert.equal(isTimedOut({ status: "timeout", timeoutUntil: new Date(Date.now() + 10000) }), true);
  assert.equal(isTimedOut({ status: "timeout", timeoutUntil: new Date(Date.now() - 10000) }), false);
  assert.equal(getBoardBlockReason({ status: "banned" }), "Your board account is banned.");

  assert.ok(BOARD_CATEGORIES.length >= 4);
  assert.ok(BOARD_CATEGORIES.some((category) => category.id === "general"));
  assert.ok(BOARD_CATEGORIES.every((category) => category.id && category.name && category.description));

  assert.equal(normalizeBoardText("  hello   \n\n   world  "), "hello\n\nworld");

  assert.deepEqual(validateThreadInput("Game thread", "Let us talk ball", "nba"), {
    ok: true,
    title: "Game thread",
    body: "Let us talk ball",
    categoryId: "nba",
  });
  assert.equal(validateThreadInput("Hi", "body", "general").ok, false);
  assert.equal(validateThreadInput("Valid title", "x", "general").ok, false);
  assert.equal(validateThreadInput("Valid title", "Valid body", "missing").ok, false);

  assert.deepEqual(validatePostBody("  Good point  "), { ok: true, body: "Good point" });
  assert.equal(validatePostBody("no").ok, false);

  assert.equal(canEditPost("user-1", { authorId: "user-1" }), true);
  assert.equal(canEditPost("user-1", { authorId: "user-2" }), false);
  assert.equal(canEditPost("user-1", { authorId: "user-2" }, true), true);
}

run();
