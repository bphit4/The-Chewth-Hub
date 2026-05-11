import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { LogIn } from "lucide-react";
import { auth, firebaseReady, googleProvider, microsoftProvider } from "@/lib/firebase";
import { BOARD_ADMIN_EMAIL, BOARD_ADMIN_USERNAME } from "@/lib/boardModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BoardSignIn({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<"sign-in" | "register">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function credentialEmail() {
    const value = email.trim();
    return value.toLowerCase() === BOARD_ADMIN_USERNAME.toLowerCase() ? BOARD_ADMIN_EMAIL : value;
  }

  async function run(action: () => Promise<void>) {
    if (!auth) {
      setError("Firebase Auth is not configured yet.");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await action();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/configuration-not-found") {
        setError("Firebase Authentication is not enabled for this project yet. Enable Authentication and the sign-in providers in Firebase Console.");
      } else if (code === "auth/operation-not-allowed") {
        setError("That sign-in provider is disabled in Firebase Console.");
      } else if (code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Firebase Authentication.");
      } else {
        setError(err?.message ?? "Sign-in failed");
      }
    } finally {
      setBusy(false);
    }
  }

  const submitEmail = () => run(async () => {
    if (mode === "register") {
      const loginEmail = credentialEmail();
      const cred = await createUserWithEmailAndPassword(auth!, loginEmail, password);
      const name = loginEmail.toLowerCase() === BOARD_ADMIN_EMAIL ? BOARD_ADMIN_USERNAME : displayName.trim();
      if (name) await updateProfile(cred.user, { displayName: name });
      return;
    }
    await signInWithEmailAndPassword(auth!, credentialEmail(), password);
  });

  if (!firebaseReady) {
    return (
      <div className="rounded border border-border bg-card p-4 text-sm text-muted-foreground">
        Firebase is not configured. Add the `VITE_FIREBASE_*` values to `.env`.
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "rounded border border-border bg-card p-4 space-y-4"}>
      {!compact && (
        <div>
          <div className="font-heading text-lg font-bold uppercase">Join the Board</div>
          <div className="text-sm text-muted-foreground">Sign in to create threads and reply.</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="min-w-0 px-2" onClick={() => run(async () => { await signInWithPopup(auth!, googleProvider); })} disabled={busy}>
          <LogIn className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">Google</span>
        </Button>
        <Button variant="outline" className="min-w-0 px-2" onClick={() => run(async () => { await signInWithPopup(auth!, microsoftProvider); })} disabled={busy}>
          <LogIn className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">Outlook</span>
        </Button>
      </div>

      <div className="grid gap-2">
        {mode === "register" && (
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" />
        )}
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email or TheChewth" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <div className="grid gap-2">
          <Button onClick={submitEmail} disabled={busy || !email || !password}>
            {mode === "register" ? "Create Account" : "Sign In"}
          </Button>
          <Button variant="ghost" className="justify-center text-muted-foreground" onClick={() => setMode(mode === "register" ? "sign-in" : "register")} disabled={busy}>
            {mode === "register" ? "Use Existing Account" : "Create Email Account"}
          </Button>
        </div>
      </div>

      {error && <div className="text-sm font-semibold text-destructive">{error}</div>}
    </div>
  );
}
