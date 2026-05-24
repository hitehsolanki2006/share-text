import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Copy,
  Download,
  Check,
  Clock,
  Flame,
  KeyRound,
  AlertTriangle,
  Plus,
  ShieldX,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { consumePaste, getPasteMeta } from "@/lib/pastes.functions";
import { decryptText } from "@/lib/crypto";

export const Route = createFileRoute("/p/$id")({
  head: () => ({
    meta: [
      { title: "Decrypting · ShareText" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ViewPage,
});

type State =
  | { kind: "loading" }
  | { kind: "needs-password"; salt: string }
  | { kind: "ok"; text: string; expiresAt: string; burn: boolean }
  | { kind: "error"; code: "not-found" | "expired" | "burned" | "bad-key" | "wrong-password" | "unknown"; message?: string };

function ViewPage() {
  const { id } = Route.useParams();
  const meta = useServerFn(getPasteMeta);
  const consume = useServerFn(consumePaste);

  const [state, setState] = useState<State>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const m = await meta({ data: { id } });
        if (m.status !== "ok") {
          setState({ kind: "error", code: m.status });
          return;
        }
        if (m.passwordProtected) {
          setState({ kind: "needs-password", salt: m.salt ?? "" });
          return;
        }
        await tryDecrypt();
      } catch (e) {
        setState({ kind: "error", code: "unknown", message: (e as Error).message });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function tryDecrypt(pwd?: string) {
    setSubmitting(true);
    try {
      const r = await consume({ data: { id } });
      if (r.status !== "ok") {
        setState({ kind: "error", code: r.status });
        return;
      }
      const keyFragment = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : null;
      try {
        const text = await decryptText({
          ciphertext: r.ciphertext,
          iv: r.iv,
          salt: r.salt,
          keyFragment,
          password: pwd,
        });
        setState({ kind: "ok", text, expiresAt: r.expiresAt, burn: false });
      } catch {
        setState({ kind: "error", code: pwd ? "wrong-password" : "bad-key" });
      }
    } catch (e) {
      setState({ kind: "error", code: "unknown", message: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  async function copy() {
    if (state.kind !== "ok") return;
    await navigator.clipboard.writeText(state.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  function download() {
    if (state.kind !== "ok") return;
    const blob = new Blob([state.text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sharetext-${id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Layout>
      <section className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 animate-fade-in-up">
        {state.kind === "loading" && <LoadingCard />}

        {state.kind === "needs-password" && (
          <div className="glass rounded-2xl p-8 text-center shadow-card">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold">Password required</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This paste is locked with a password.
            </p>
            <div className="mx-auto mt-5 flex max-w-sm gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryDecrypt(password)}
                placeholder="Enter password"
                className="font-mono w-full rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
                autoFocus
              />
              <button
                onClick={() => tryDecrypt(password)}
                disabled={submitting || !password}
                className="rounded-lg bg-gradient-primary px-4 text-sm font-medium text-primary-foreground glow disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
              </button>
            </div>
          </div>
        )}

        {state.kind === "ok" && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <CountdownPill expiresAt={state.expiresAt} now={now} />
              <div className="flex items-center gap-2">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-secondary/60 px-3 py-2 text-sm hover:bg-secondary transition"
                >
                  {copied ? <Check className="h-4 w-4 text-primary animate-fade-in-up" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy text"}
                </button>
                <button
                  onClick={download}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-secondary/60 px-3 py-2 text-sm hover:bg-secondary transition"
                >
                  <Download className="h-4 w-4" /> .txt
                </button>
              </div>
            </div>

            <div className="glass overflow-hidden rounded-2xl shadow-card">
              <div className="flex items-center justify-between border-b border-glass-border px-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary glow" />
                  Decrypted in your browser
                </span>
                <span className="font-mono">{state.text.length.toLocaleString()} chars</span>
              </div>
              <pre className="font-mono max-h-[60vh] overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-relaxed">
                {state.text}
              </pre>
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-secondary/40 px-4 py-2 text-sm hover:bg-secondary transition"
              >
                <Plus className="h-4 w-4" /> Create Your Own
              </Link>
            </div>
          </div>
        )}

        {state.kind === "error" && <ErrorCard code={state.code} />}
      </section>
    </Layout>
  );
}

function LoadingCard() {
  return (
    <div className="glass rounded-2xl p-12 text-center shadow-card">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <h1 className="text-lg font-semibold">Decrypting...</h1>
      <p className="mt-1 text-sm text-muted-foreground">Verifying paste and unlocking your text.</p>
    </div>
  );
}

function CountdownPill({ expiresAt, now }: { expiresAt: string; now: number }) {
  const ms = Math.max(0, new Date(expiresAt).getTime() - now);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const text = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3 text-primary" /> Expires in <span className="font-mono text-foreground">{text}</span>
    </span>
  );
}

function ErrorCard({ code }: { code: "not-found" | "expired" | "burned" | "bad-key" | "wrong-password" | "unknown" }) {
  const map = {
    "not-found": { icon: ShieldX, title: "Paste not found", body: "This link doesn't exist. It may have been deleted." },
    expired: { icon: Clock, title: "This paste has expired", body: "The expiration window has passed and the content was deleted." },
    burned: { icon: Flame, title: "Already viewed", body: "This burn-after-reading paste has already been opened." },
    "bad-key": { icon: AlertTriangle, title: "Invalid decryption key", body: "The link appears to be incomplete or modified. Make sure the full URL was copied." },
    "wrong-password": { icon: KeyRound, title: "Wrong password", body: "We couldn't decrypt with that password. Try again." },
    unknown: { icon: AlertTriangle, title: "Something went wrong", body: "Try refreshing the page." },
  } as const;
  const { icon: Icon, title, body } = map[code];
  return (
    <div className="glass rounded-2xl p-10 text-center shadow-card">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-destructive/15">
        <Icon className="h-6 w-6 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glow"
      >
        <Plus className="h-4 w-4" /> Create a new paste
      </Link>
    </div>
  );
}
