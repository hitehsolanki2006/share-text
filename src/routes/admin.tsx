import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Loader2, Trash2, Database, FileText, ShieldCheck } from "lucide-react";
import { adminDeletePaste, adminListPastes, adminLogin } from "@/lib/pastes.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · ShareText" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Paste = {
  id: string;
  created_at: string;
  expires_at: string;
  views: number;
  size_bytes: number;
  burn_after_reading: boolean;
  viewed: boolean;
  password_protected: boolean;
};

function AdminPage() {
  const login = useServerFn(adminLogin);
  const list = useServerFn(adminListPastes);
  const del = useServerFn(adminDeletePaste);

  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    pastes: Paste[];
    total: number;
    active: number;
    totalBytes: number;
  } | null>(null);

  async function refresh(pwd: string) {
    const d = await list({ data: { password: pwd } });
    setData(d as never);
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await login({ data: { password } });
      setAuth(password);
      await refresh(password);
    } catch (e) {
      setError((e as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!auth) return;
    await del({ data: { password: auth, id } });
    await refresh(auth);
  }

  if (!auth) {
    return (
      <div className="grid min-h-screen place-items-center px-4 animate-fade-in-up">
        <div className="glass w-full max-w-sm rounded-2xl p-8 shadow-card">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary glow">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Admin access</h1>
            <p className="mt-1 text-xs text-muted-foreground">Enter the admin password to continue.</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Password"
            className="font-mono w-full rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
          <button
            onClick={submit}
            disabled={loading || !password}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground glow disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 animate-fade-in-up">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => {
            setAuth(null);
            setPassword("");
            setData(null);
          }}
          className="rounded-lg border border-glass-border bg-secondary/60 px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Sign out
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Total pastes" value={data?.total ?? "—"} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Active pastes" value={data?.active ?? "—"} />
        <StatCard
          icon={<Database className="h-4 w-4" />}
          label="Storage used"
          value={data ? formatBytes(data.totalBytes) : "—"}
        />
      </div>

      <div className="glass mt-6 overflow-hidden rounded-2xl shadow-card">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-3 text-xs text-muted-foreground">
          <span>Pastes</span>
          <span>Content is encrypted — only metadata visible.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>ID</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Views</Th>
                <Th>Size</Th>
                <Th>Flags</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.pastes ?? []).map((p) => (
                <tr key={p.id} className="border-t border-glass-border hover:bg-background/30 transition">
                  <Td className="font-mono">{p.id}</Td>
                  <Td>{new Date(p.created_at).toLocaleString()}</Td>
                  <Td>{new Date(p.expires_at).toLocaleString()}</Td>
                  <Td>{p.views}</Td>
                  <Td>{formatBytes(p.size_bytes)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      {p.password_protected && <Pill>🔑</Pill>}
                      {p.burn_after_reading && <Pill>🔥</Pill>}
                      {p.viewed && <Pill>👁</Pill>}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => remove(p.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </Td>
                </tr>
              ))}
              {data && data.pastes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No pastes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-md bg-secondary text-primary">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{children}</span>;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}
