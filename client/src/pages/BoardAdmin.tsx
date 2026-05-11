import { useEffect, useState } from "react";
import { Link } from "wouter";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { ArrowLeft, Ban, Clock, Crown, Lock, MessageSquare, Pin, RotateCcw, Shield, Trash2, UserCog, Users } from "lucide-react";
import { useBoardAuth } from "@/components/board/BoardAuthProvider";
import { BoardSignIn } from "@/components/board/BoardSignIn";
import {
  BOARD_ADMIN_USERNAME,
  BOARD_ROLE_ABILITIES,
  BOARD_ROLE_LABELS,
  BOARD_STATUS_LABELS,
  canManageProfile,
  roleRank,
  type BoardProfile,
  type BoardRole,
} from "@/lib/boardModel";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ThreadDoc = {
  id: string;
  title: string;
  authorName: string;
  categoryId: string;
  replyCount?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isDeleted?: boolean;
  lastActivityAt?: any;
};

function formatDate(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}

export default function BoardAdmin() {
  const { user, profile, canModerate, canManageUsers } = useBoardAuth();
  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [profiles, setProfiles] = useState<BoardProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !canModerate) return;
    const ref = query(collection(db, "forumThreads"), orderBy("lastActivityAt", "desc"));
    return onSnapshot(ref, (snap) => {
      setThreadsLoaded(true);
      setThreads(snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ThreadDoc, "id">) })));
    }, (err) => {
      setThreadsLoaded(true);
      setError(err.message);
    });
  }, [canModerate]);

  useEffect(() => {
    if (!db || !canManageUsers) return;
    const ref = query(collection(db, "forumProfiles"), orderBy("lastSeenAt", "desc"));
    return onSnapshot(ref, (snap) => {
      setProfilesLoaded(true);
      setProfiles(snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<BoardProfile, "id">) })));
    }, (err) => {
      setProfilesLoaded(true);
      setError(err.message);
    });
  }, [canManageUsers]);

  async function updateThread(thread: ThreadDoc, fields: Partial<ThreadDoc>) {
    if (!db || !canModerate) return;
    await updateDoc(doc(db, "forumThreads", thread.id), { ...fields, updatedAt: serverTimestamp() });
  }

  async function updateProfile(target: BoardProfile, fields: Partial<BoardProfile>) {
    if (!db || !profile || !canManageProfile(profile, target)) return;
    await updateDoc(doc(db, "forumProfiles", target.uid), { ...fields, updatedAt: serverTimestamp() });
  }

  function timeoutUntil(hours: number) {
    return Timestamp.fromDate(new Date(Date.now() + hours * 60 * 60 * 1000));
  }

  function availableRoles(target: BoardProfile): BoardRole[] {
    const roles: BoardRole[] = ["member", "moderator", "admin"];
    if (profile?.role === "owner") roles.push("owner");
    return roles.filter((role) => roleRank(role) < roleRank(profile?.role) || role === target.role);
  }

  const activeThreads = threads.filter((thread) => !thread.isDeleted);
  const lockedThreads = threads.filter((thread) => thread.isLocked && !thread.isDeleted);
  const pinnedThreads = threads.filter((thread) => thread.isPinned && !thread.isDeleted);
  const restrictedProfiles = profiles.filter((item) => item.status === "banned" || item.status === "timeout" || item.status === "deleted");

  if (!user || !canModerate) {
    return (
      <div className="bg-background pb-20">
        <div className="container px-4 md:px-6 py-8 max-w-xl">
          <Link href="/board" className="inline-flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Board
          </Link>
          <Card className="mt-6 p-5 space-y-4">
            <div>
              <div className="font-heading text-xl font-black uppercase">Board Admin</div>
              <div className="text-sm text-muted-foreground">
                Sign in as `{BOARD_ADMIN_USERNAME}` or a moderator account to manage the board.
              </div>
            </div>
            <BoardSignIn />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-5">
          <Link href="/board" className="inline-flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Board
          </Link>
          <h1 className="mt-3 text-2xl font-heading font-black uppercase tracking-tight">
            <Shield className="mr-2 inline h-5 w-5" /> Board Admin
          </h1>
          <p className="text-sm text-muted-foreground">Moderating as {profile?.displayName || BOARD_ADMIN_USERNAME}.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Threads</div>
            <div className="mt-2 text-3xl font-heading font-black">{activeThreads.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pinned</div>
            <div className="mt-2 text-3xl font-heading font-black">{pinnedThreads.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{canManageUsers ? "Restricted Users" : "Locked"}</div>
            <div className="mt-2 text-3xl font-heading font-black">{canManageUsers ? restrictedProfiles.length : lockedThreads.length}</div>
          </Card>
        </div>

        {error && <Card className="p-4 text-sm font-bold text-destructive">{error}</Card>}
        {!error && (
          <Card className="p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Firestore status: threads {threadsLoaded ? "connected" : "connecting"} / users {canManageUsers ? profilesLoaded ? "connected" : "connecting" : "moderator-only"}
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center gap-2 font-heading text-lg font-bold uppercase">
                  <UserCog className="h-5 w-5" /> Moderation Queue
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b pb-2"><span>Deleted threads</span><strong>{threads.filter((thread) => thread.isDeleted).length}</strong></div>
                  <div className="flex items-center justify-between border-b pb-2"><span>Locked threads</span><strong>{lockedThreads.length}</strong></div>
                  <div className="flex items-center justify-between"><span>Restricted users</span><strong>{restrictedProfiles.length}</strong></div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 font-heading text-lg font-bold uppercase">
                  <Crown className="h-5 w-5" /> Role Abilities
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  {(["owner", "admin", "moderator", "member"] as BoardRole[]).map((role) => (
                    <div key={role} className="rounded border p-3">
                      <div className="font-bold">{BOARD_ROLE_LABELS[role]}</div>
                      <div className="text-muted-foreground">{BOARD_ROLE_ABILITIES[role][0]}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users">
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2 font-heading text-lg font-bold uppercase">
                  <Users className="h-5 w-5" /> User List
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((item) => {
                      const manageable = Boolean(profile && canManageProfile(profile, item));
                      return (
                        <TableRow key={item.uid}>
                          <TableCell>
                            <div className="font-bold">{item.displayName || item.email || item.uid}</div>
                            <div className="text-xs text-muted-foreground">{item.email}</div>
                          </TableCell>
                          <TableCell>
                            {manageable ? (
                              <Select value={item.role} onValueChange={(role) => updateProfile(item, { role: role as BoardRole })}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {availableRoles(item).map((role) => (
                                    <SelectItem key={role} value={role}>{BOARD_ROLE_LABELS[role]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={item.role === "owner" ? "default" : "secondary"}>{BOARD_ROLE_LABELS[item.role]}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "active" ? "secondary" : "destructive"}>{BOARD_STATUS_LABELS[item.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(item.lastSeenAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" disabled={!manageable} onClick={() => updateProfile(item, { status: "timeout", timeoutUntil: timeoutUntil(1) })}>
                                <Clock className="mr-2 h-4 w-4" /> 1h
                              </Button>
                              <Button variant="outline" size="sm" disabled={!manageable} onClick={() => updateProfile(item, { status: "timeout", timeoutUntil: timeoutUntil(24) })}>
                                <Clock className="mr-2 h-4 w-4" /> 24h
                              </Button>
                              <Button variant="outline" size="sm" disabled={!manageable} onClick={() => updateProfile(item, { status: "banned", timeoutUntil: null })}>
                                <Ban className="mr-2 h-4 w-4" /> Ban
                              </Button>
                              <Button variant="outline" size="sm" disabled={!manageable} onClick={() => updateProfile(item, { status: "active", timeoutUntil: null })}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Restore
                              </Button>
                              <Button variant="destructive" size="sm" disabled={!manageable} onClick={() => updateProfile(item, { status: "deleted", timeoutUntil: null })}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {!profiles.length && <div className="p-6 text-center text-sm text-muted-foreground">Users appear here after they sign in.</div>}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="threads">
            <div className="space-y-3">
              {!error && threads.length === 0 && (
                <Card className="p-8 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-3 font-heading text-xl font-bold uppercase">No Threads Yet</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New board posts will appear here for pinning, locking, or removal.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/board">Start the First Thread</Link>
                  </Button>
                </Card>
              )}
              {threads.map((thread) => (
                <Card key={thread.id} className={`p-4 ${thread.isDeleted ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/board/${thread.id}`} className="font-heading font-bold uppercase hover:text-primary">
                        {thread.title}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {thread.categoryId} / {thread.authorName} / {thread.replyCount ?? 0} replies / {formatDate(thread.lastActivityAt)}
                      </div>
                      <div className="mt-2 flex gap-2">
                        {thread.isPinned && <Badge>Pinned</Badge>}
                        {thread.isLocked && <Badge variant="secondary">Locked</Badge>}
                        {thread.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateThread(thread, { isPinned: !thread.isPinned })}>
                        <Pin className="mr-2 h-4 w-4" /> {thread.isPinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateThread(thread, { isLocked: !thread.isLocked })}>
                        <Lock className="mr-2 h-4 w-4" /> {thread.isLocked ? "Unlock" : "Lock"}
                      </Button>
                      <Button variant={thread.isDeleted ? "outline" : "destructive"} size="sm" onClick={() => updateThread(thread, { isDeleted: !thread.isDeleted })}>
                        <Trash2 className="mr-2 h-4 w-4" /> {thread.isDeleted ? "Restore" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roles">
            <div className="grid gap-4 md:grid-cols-2">
              {(["owner", "admin", "moderator", "member"] as BoardRole[]).map((role) => (
                <Card key={role} className="p-5">
                  <div className="font-heading text-xl font-black uppercase">{BOARD_ROLE_LABELS[role]}</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {BOARD_ROLE_ABILITIES[role].map((ability) => (
                      <li key={ability}>- {ability}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
