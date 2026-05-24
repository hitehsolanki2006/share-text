import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Flame, Key, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SuccessModal } from "@/components/SuccessModal";
import { encryptText, randomId } from "@/lib/crypto";
import { createPaste } from "@/lib/pastes.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShareText — Zero-knowledge encrypted text sharing" },
      {
        name: "description",
        content:
          "Share text securely with end-to-end encryption. Burn after reading, password protection, and expiration — all encrypted in your browser.",
      },
      { property: "og:title", content: "ShareText — Encrypted text sharing" },
      {
        property: "og:description",
        content: "Zero-knowledge encrypted text sharing. We can't read it.",
      },
    ],
  }),
  component: HomePage,
});

const EXPIRATIONS = [
  { value: "5", label: "5 minutes" },
  { value: "60", label: "1 hour" },
  { value: "1440", label: "24 hours" },
  { value: "10080", label: "7 days" },
] as const;

function HomePage() {
  const create = useServerFn(createPaste);
  const [text, setText] = useState("");
  const [expiration, setExpiration] = useState<(typeof EXPIRATIONS)[number]["value"]>("1440");
  const [burn, setBurn] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);

  const count = useMemo(() => text.length, [text]);
  const canSubmit = text.trim().length > 0 && !loading && (!usePassword || password.length >= 4);

  async function handleSubmit() {
    setError(null);
    if (!text.trim()) return;
    setLoading(true);
    try {
      const id = randomId(8); // Shorter ID: 8 characters instead of 12
      const enc = await encryptText(text, usePassword ? password : undefined);
      await create({
        data: {
          id,
          ciphertext: enc.ciphertext,
          iv: enc.iv,
          salt: enc.salt,
          passwordProtected: usePassword,
          burnAfterReading: burn,
          expirationMinutes: expiration,
        },
      });
      
      // Extract decryption key code
      let keyCode = "";
      let fullKeyFragment = "";
      if (enc.keyFragment) {
        const [fullKey, code] = enc.keyFragment.split(':');
        keyCode = code;
        fullKeyFragment = enc.keyFragment; // Store full fragment with code
      }
      
      const url = `${window.location.origin}/p/${id}${fullKeyFragment ? `#${fullKeyFragment}` : ""}`;
      setShareUrl(url);
      setDecryptionKey(keyCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setText("");
    setPassword("");
    setUsePassword(false);
    setBurn(false);
    setShareUrl(null);
    setDecryptionKey(null);
  }

  return (
    <Layout>
      <section className="container mx-auto max-w-3xl px-4 pt-12 sm:pt-20 pb-12 animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-glass-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            End-to-end encrypted · open source
          </div>
          <h1 className="text-balance text-4xl sm:text-5xl font-semibold tracking-tight">
            Share text, <span className="text-gradient">privately.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Paste it, lock it, send the link. Your text is encrypted in your browser
            before it ever leaves your device.
          </p>
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6 shadow-card">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="font-mono min-h-[220px] w-full resize-y rounded-xl border border-glass-border bg-background/40 p-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-primary" />
                Zero-knowledge encrypted
              </span>
              <span className="font-mono">{count.toLocaleString()} chars</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Expires after
              </span>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as typeof expiration)}
                className="w-full rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
              >
                {EXPIRATIONS.map((e) => (
                  <option key={e.value} value={e.value} className="bg-card">
                    {e.label}
                  </option>
                ))}
              </select>
            </label>

            <ToggleRow
              icon={<Flame className="h-4 w-4 text-primary" />}
              label="Burn after reading"
              hint="Destroys the paste after the first view"
              checked={burn}
              onChange={setBurn}
            />
          </div>

          <div className="mt-4">
            <ToggleRow
              icon={<Key className="h-4 w-4 text-primary" />}
              label="Password protection"
              hint="Recipient must enter a password to decrypt"
              checked={usePassword}
              onChange={setUsePassword}
            />
            {usePassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 4 chars)"
                className="mt-2 w-full rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-primary/50 font-mono"
              />
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed glow-lg animate-glow-pulse"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Encrypting...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Create Secure Link
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            🔒 Your text is encrypted in your browser. We can't read it.
          </p>
        </div>
      </section>

      {shareUrl && decryptionKey && (
        <SuccessModal
          url={shareUrl}
          decryptionKey={decryptionKey}
          onClose={() => setShareUrl(null)}
          onCreateAnother={resetAll}
        />
      )}
    </Layout>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-left transition hover:bg-background/60"
    >
      <span className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-secondary">{icon}</span>
        <span>
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-gradient-primary glow" : "bg-secondary"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
