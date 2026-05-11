import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canManageUsers, canModerate, getBoardBlockReason, getInitialBoardRole, isBoardAdmin, type BoardProfile } from "@/lib/boardModel";

type BoardAuthContextValue = {
  user: User | null;
  profile: BoardProfile | null;
  loading: boolean;
  isAdmin: boolean;
  canModerate: boolean;
  canManageUsers: boolean;
  blockedReason: string | null;
};

const BoardAuthContext = createContext<BoardAuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  canModerate: false,
  canManageUsers: false,
  blockedReason: null,
});

export function BoardAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BoardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) setProfile(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const ref = doc(db, "forumProfiles", user.uid);
    getDoc(ref).then((snap) => {
      const baseProfile = {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName || user.email?.split("@")[0] || "Chewth Fan",
        photoURL: user.photoURL ?? "",
        updatedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      };
      if (snap.exists()) {
        return updateDoc(ref, baseProfile);
      }
      return setDoc(ref, {
        ...baseProfile,
        role: getInitialBoardRole(user),
        status: "active",
        createdAt: serverTimestamp(),
      });
    }).catch(() => {
      // Profile creation errors surface naturally through board actions.
    });
    return onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<BoardProfile, "id">) } : null);
    });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: isBoardAdmin(user) || profile?.role === "owner" || profile?.role === "admin",
      canModerate: canModerate(profile) || isBoardAdmin(user),
      canManageUsers: canManageUsers(profile) || isBoardAdmin(user),
      blockedReason: getBoardBlockReason(profile),
    }),
    [user, profile, loading],
  );

  return <BoardAuthContext.Provider value={value}>{children}</BoardAuthContext.Provider>;
}

export function useBoardAuth() {
  return useContext(BoardAuthContext);
}
