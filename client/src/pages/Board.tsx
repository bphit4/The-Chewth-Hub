import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { Filter, MessageSquare, Pin, Plus, Search, Shield, SlidersHorizontal, User } from "lucide-react";
import { useBoardAuth } from "@/components/board/BoardAuthProvider";
import { BoardSignIn } from "@/components/board/BoardSignIn";
import { BOARD_CATEGORIES, validateThreadInput } from "@/lib/boardModel";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ThreadDoc = {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  replyCount?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isDeleted?: boolean;
  lastActivityAt?: any;
  createdAt?: any;
};

function formatDate(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}

export default function Board() {
  const { user, profile, isAdmin, canModerate, blockedReason } = useBoardAuth();
  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [composerCategory, setComposerCategory] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("latest");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    const constraints = categoryId === "all"
      ? [where("isDeleted", "==", false), orderBy("isPinned", "desc"), orderBy("lastActivityAt", "desc")]
      : [where("isDeleted", "==", false), where("categoryId", "==", categoryId), orderBy("isPinned", "desc"), orderBy("lastActivityAt", "desc")];
    const ref = query(collection(db, "forumThreads"), ...constraints);
    return onSnapshot(ref, (snap) => {
      setThreads(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ThreadDoc, "id">) })));
    }, (err) => setError(err.message));
  }, [categoryId]);

  const categoryMap = useMemo(() => new Map(BOARD_CATEGORIES.map((item) => [item.id, item])), []);
  const activeCategory = categoryId === "all" ? null : categoryMap.get(categoryId);

  function selectCategory(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    if (nextCategoryId !== "all") setComposerCategory(nextCategoryId);
  }

  function dateValue(value: any) {
    const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
    return date ? date.getTime() : 0;
  }

  const filteredThreads = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const visible = threads.filter((thread) => {
      if (statusFilter === "open" && thread.isLocked) return false;
      if (statusFilter === "locked" && !thread.isLocked) return false;
      if (statusFilter === "pinned" && !thread.isPinned) return false;
      if (statusFilter === "unanswered" && (thread.replyCount ?? 0) > 0) return false;
      if (!needle) return true;
      const category = categoryMap.get(thread.categoryId)?.name ?? "";
      return [
        thread.title,
        thread.body,
        thread.authorName,
        category,
      ].some((value) => value.toLowerCase().includes(needle));
    });

    return [...visible].sort((a, b) => {
      if ((b.isPinned ? 1 : 0) !== (a.isPinned ? 1 : 0)) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if (sortMode === "newest") return dateValue(b.createdAt) - dateValue(a.createdAt);
      if (sortMode === "oldest") return dateValue(a.createdAt) - dateValue(b.createdAt);
      if (sortMode === "replies") return (b.replyCount ?? 0) - (a.replyCount ?? 0);
      return dateValue(b.lastActivityAt) - dateValue(a.lastActivityAt);
    });
  }, [categoryMap, searchTerm, sortMode, statusFilter, threads]);

  const totalReplies = useMemo(() => threads.reduce((total, thread) => total + (thread.replyCount ?? 0), 0), [threads]);
  const pinnedCount = useMemo(() => threads.filter((thread) => thread.isPinned).length, [threads]);

  async function createThread() {
    if (!db || !user) return;
    if (blockedReason) {
      setError(blockedReason);
      return;
    }
    const validated = validateThreadInput(title, body, composerCategory);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const authorName = profile?.displayName || user.displayName || user.email?.split("@")[0] || "Chewth Fan";
      const now = serverTimestamp();
      const threadRef = await addDoc(collection(db, "forumThreads"), {
        title: validated.title,
        body: validated.body,
        categoryId: validated.categoryId,
        authorId: user.uid,
        authorName,
        authorEmail: user.email ?? "",
        replyCount: 0,
        isPinned: false,
        isLocked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      });
      await addDoc(collection(db, "forumPosts"), {
        threadId: threadRef.id,
        body: validated.body,
        authorId: user.uid,
        authorName,
        authorEmail: user.email ?? "",
        isThreadRoot: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
      setTitle("");
      setBody("");
      setCategoryId(validated.categoryId);
      setComposerCategory(validated.categoryId);
    } catch (err: any) {
      setError(err?.message ?? "Could not create thread");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-black uppercase tracking-tight">Message Board</h1>
            <p className="text-sm text-muted-foreground">Talk sports, react to shows, and keep the arguments searchable.</p>
          </div>
          <div className="flex items-center gap-2">
            {canModerate && (
              <Link href="/board/admin">
                <Button variant="outline" size="sm" className="uppercase font-bold tracking-wider">
                  <Shield className="mr-2 h-4 w-4" /> Board Admin
                </Button>
              </Link>
            )}
            {user && auth && (
              <Button variant="ghost" size="sm" onClick={() => auth?.signOut()} className="uppercase font-bold tracking-wider">
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-3">
          <Card className="p-3">
            <button onClick={() => selectCategory("all")} className={`w-full text-left rounded px-3 py-2 text-sm font-bold uppercase ${categoryId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              All Boards
            </button>
            {BOARD_CATEGORIES.map((category) => (
              <button key={category.id} onClick={() => selectCategory(category.id)} className={`mt-1 w-full text-left rounded px-3 py-2 text-sm font-bold uppercase ${categoryId === category.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {category.name}
              </button>
            ))}
          </Card>
          <Card className="p-4 text-sm">
            <div className="font-heading text-base font-bold uppercase">
              {activeCategory?.name ?? "All Boards"}
            </div>
            <p className="mt-1 text-muted-foreground">
              {activeCategory?.description ?? "Every board, newest activity, pinned topics, and open conversations."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded border p-2">
                <div className="font-heading text-lg font-black">{threads.length}</div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Threads</div>
              </div>
              <div className="rounded border p-2">
                <div className="font-heading text-lg font-black">{totalReplies}</div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Replies</div>
              </div>
              <div className="rounded border p-2">
                <div className="font-heading text-lg font-black">{pinnedCount}</div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Pinned</div>
              </div>
            </div>
          </Card>
          {!user ? <BoardSignIn /> : (
            <Card className="p-4 text-sm">
              <div className="flex items-center gap-2 font-bold">
                <User className="h-4 w-4" /> {user.displayName || user.email}
              </div>
              <div className="text-muted-foreground mt-1">
                {profile?.role ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}` : isAdmin ? "Owner/Admin" : "Signed in"}
              </div>
              {blockedReason && <div className="mt-2 text-xs font-bold text-destructive">{blockedReason}</div>}
            </Card>
          )}
        </aside>

        <main className="space-y-5">
          {user && !blockedReason && (
            <Card className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-heading font-bold uppercase">
                  <Plus className="h-4 w-4" /> Start a Thread
                </div>
                <Badge variant="secondary">
                  Posting to {categoryMap.get(composerCategory)?.name ?? "General"}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <Select value={composerCategory} onValueChange={setComposerCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOARD_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" maxLength={120} />
              </div>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What are we talking about?" rows={5} />
              <Button onClick={createThread} disabled={busy}>Post Thread</Button>
            </Card>
          )}
          {user && blockedReason && (
            <Card className="p-4 text-sm font-bold text-destructive">{blockedReason}</Card>
          )}

          {error && <Card className="p-4 text-sm font-bold text-destructive">{error}</Card>}

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-heading font-bold uppercase">
                <SlidersHorizontal className="h-4 w-4" /> Browse Threads
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Showing {filteredThreads.length} of {threads.length}
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search titles, posts, authors, or boards..."
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All threads</SelectItem>
                  <SelectItem value="open">Open only</SelectItem>
                  <SelectItem value="locked">Locked only</SelectItem>
                  <SelectItem value="pinned">Pinned only</SelectItem>
                  <SelectItem value="unanswered">Unanswered</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortMode} onValueChange={setSortMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest activity</SelectItem>
                  <SelectItem value="newest">Newest threads</SelectItem>
                  <SelectItem value="oldest">Oldest threads</SelectItem>
                  <SelectItem value="replies">Most replies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="space-y-3">
            {filteredThreads.map((thread) => {
              const category = categoryMap.get(thread.categoryId);
              return (
                <Link key={thread.id} href={`/board/${thread.id}`}>
                  <Card className="p-4 hover:border-primary/60 transition-colors cursor-pointer">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {thread.isPinned && <Pin className="h-4 w-4 text-primary" />}
                          <h2 className="font-heading text-lg font-bold uppercase tracking-tight">{thread.title}</h2>
                          <Badge variant="outline">{category?.name ?? "Board"}</Badge>
                          {thread.isLocked && <Badge variant="secondary">Locked</Badge>}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          by {thread.authorName} / started {formatDate(thread.createdAt)} / latest {formatDate(thread.lastActivityAt)}
                        </div>
                        <div className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {thread.body}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <MessageSquare className="h-4 w-4" /> {thread.replyCount ?? 0}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
            {!threads.length && <Card className="p-8 text-center text-muted-foreground">No threads yet. Start the first one.</Card>}
            {threads.length > 0 && !filteredThreads.length && (
              <Card className="p-8 text-center text-muted-foreground">No threads match your search or filters.</Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
