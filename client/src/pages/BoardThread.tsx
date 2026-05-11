import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { ArrowLeft, Lock, Pin, Shield, Trash2 } from "lucide-react";
import { useBoardAuth } from "@/components/board/BoardAuthProvider";
import { BoardSignIn } from "@/components/board/BoardSignIn";
import { canEditPost, validatePostBody } from "@/lib/boardModel";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ThreadDoc = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  replyCount?: number;
  isPinned?: boolean;
  isLocked?: boolean;
  isDeleted?: boolean;
  createdAt?: any;
};

type PostDoc = {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorName: string;
  isThreadRoot?: boolean;
  isDeleted?: boolean;
  createdAt?: any;
};

function formatDate(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date ? date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
}

export default function BoardThread() {
  const [, params] = useRoute("/board/:threadId");
  const threadId = params?.threadId;
  const { user, profile, isAdmin, canModerate, blockedReason } = useBoardAuth();
  const [thread, setThread] = useState<ThreadDoc | null>(null);
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !threadId) return;
    return onSnapshot(doc(db, "forumThreads", threadId), (snap) => {
      setThread(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<ThreadDoc, "id">) } : null);
    }, (err) => setError(err.message));
  }, [threadId]);

  useEffect(() => {
    if (!db || !threadId) return;
    const ref = query(collection(db, "forumPosts"), where("threadId", "==", threadId), where("isDeleted", "==", false), orderBy("createdAt", "asc"));
    return onSnapshot(ref, (snap) => {
      setPosts(snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<PostDoc, "id">) })));
    }, (err) => setError(err.message));
  }, [threadId]);

  async function createReply() {
    if (!db || !user || !threadId || !thread || thread.isLocked) return;
    if (blockedReason) {
      setError(blockedReason);
      return;
    }
    const validated = validatePostBody(reply);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const now = serverTimestamp();
      const authorName = profile?.displayName || user.displayName || user.email?.split("@")[0] || "Chewth Fan";
      await addDoc(collection(db, "forumPosts"), {
        threadId,
        body: validated.body,
        authorId: user.uid,
        authorName,
        authorEmail: user.email ?? "",
        isThreadRoot: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
      await updateDoc(doc(db, "forumThreads", threadId), {
        replyCount: increment(1),
        lastActivityAt: now,
        updatedAt: now,
      });
      setReply("");
    } catch (err: any) {
      setError(err?.message ?? "Could not post reply");
    } finally {
      setBusy(false);
    }
  }

  async function softDeletePost(post: PostDoc) {
    if (!db || !threadId || !canEditPost(user?.uid, post, canModerate)) return;
    await updateDoc(doc(db, "forumPosts", post.id), { isDeleted: true, deletedAt: serverTimestamp() });
    if (!post.isThreadRoot) {
      await updateDoc(doc(db, "forumThreads", threadId), { replyCount: increment(-1), updatedAt: serverTimestamp() });
    }
  }

  async function updateThreadModeration(fields: Partial<Pick<ThreadDoc, "isPinned" | "isLocked" | "isDeleted">>) {
    if (!db || !threadId || !canModerate) return;
    await updateDoc(doc(db, "forumThreads", threadId), { ...fields, updatedAt: serverTimestamp() });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border/50 bg-card/50">
        <div className="container px-4 md:px-6 py-5">
          <Link href="/board" className="inline-flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to Board
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-heading font-black uppercase tracking-tight">{thread?.title ?? "Thread"}</h1>
              {thread && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Started by {thread.authorName} · {formatDate(thread.createdAt)}
                </div>
              )}
            </div>
            {thread && canModerate && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => updateThreadModeration({ isPinned: !thread.isPinned })}>
                  <Pin className="mr-2 h-4 w-4" /> {thread.isPinned ? "Unpin" : "Pin"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateThreadModeration({ isLocked: !thread.isLocked })}>
                  <Lock className="mr-2 h-4 w-4" /> {thread.isLocked ? "Unlock" : "Lock"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => updateThreadModeration({ isDeleted: true })}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Thread
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-6 space-y-4">
        {error && <Card className="p-4 text-sm font-bold text-destructive">{error}</Card>}
        {thread?.isLocked && (
          <Card className="p-3 text-sm font-bold text-muted-foreground">
            <Lock className="mr-2 inline h-4 w-4" /> This thread is locked.
          </Card>
        )}

        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold">{post.authorName}</div>
                <div className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                {post.isThreadRoot && <Badge variant="secondary">Original Post</Badge>}
                {canEditPost(user?.uid, post, canModerate) && (
                  <Button variant="ghost" size="sm" onClick={() => softDeletePost(post)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-6">{post.body}</div>
          </Card>
        ))}

        {!thread?.isLocked && user && !blockedReason && (
          <Card className="p-4 space-y-3">
            <div className="font-heading font-bold uppercase">Reply</div>
            <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={5} placeholder="Add your reply..." />
            <Button onClick={createReply} disabled={busy}>Post Reply</Button>
          </Card>
        )}
        {user && blockedReason && <Card className="p-4 text-sm font-bold text-destructive">{blockedReason}</Card>}

        {!user && (
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 font-bold uppercase">
              <Shield className="h-4 w-4" /> Sign in to reply
            </div>
            <BoardSignIn compact />
          </Card>
        )}
      </div>
    </div>
  );
}
