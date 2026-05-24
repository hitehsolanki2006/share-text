import { createFileRoute } from "@tanstack/react-router";
import { Lock, Key, Server, Eye, Flame, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works · ShareText" },
      {
        name: "description",
        content:
          "Learn how ShareText's zero-knowledge encryption protects your text. AES-GCM 256-bit encryption happens in your browser.",
      },
      { property: "og:title", content: "How ShareText keeps your data private" },
    ],
  }),
  component: HowPage,
});

const steps = [
  {
    icon: Lock,
    title: "Encrypted in your browser",
    body: "Your text is encrypted client-side using AES-GCM 256-bit before it ever touches the network.",
  },
  {
    icon: Key,
    title: "Keys live in the URL",
    body: "The decryption key is appended to the link as a URL fragment — fragments are never sent to our servers.",
  },
  {
    icon: Server,
    title: "Server stores ciphertext only",
    body: "We store an opaque blob of encrypted bytes with metadata. We have no way to decrypt your content.",
  },
  {
    icon: Eye,
    title: "Decrypted in the recipient's browser",
    body: "Opening the link reassembles the key from the URL fragment and decrypts locally.",
  },
  {
    icon: Flame,
    title: "Burn after reading",
    body: "Optionally destroy the paste after the first successful view. Once viewed, it's gone forever.",
  },
  {
    icon: ShieldCheck,
    title: "Expiration is enforced",
    body: "All pastes auto-expire. Expired pastes are deleted from the database on first access.",
  },
];

function HowPage() {
  return (
    <Layout>
      <section className="container mx-auto max-w-3xl px-4 py-16 animate-fade-in-up">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            How <span className="text-gradient">ShareText</span> works
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Zero-knowledge means exactly that: we never see your plaintext.
            Here's the journey of a paste from your keyboard to its recipient.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="glass rounded-2xl p-5 shadow-card transition hover:scale-[1.01]"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary glow">
                  <s.icon className="h-4 w-4 text-primary-foreground" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className="text-base font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="glass mt-10 rounded-2xl p-6 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Technical:</span>{" "}
            AES-GCM 256-bit via the browser's WebCrypto API. Password-protected pastes
            use PBKDF2-SHA256 with 250,000 iterations and a random salt stored alongside
            the ciphertext.
          </p>
        </div>
      </section>
    </Layout>
  );
}
