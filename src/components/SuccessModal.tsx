import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, QrCode, X, AlertTriangle, Plus } from "lucide-react";

export function SuccessModal({
  url,
  decryptionKey,
  onClose,
  onCreateAnother,
}: {
  url: string;
  decryptionKey: string;
  onClose: () => void;
  onCreateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 280,
      margin: 1,
      color: { dark: "#0a0f14", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [url]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(decryptionKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1800);
  };

  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "sharetext-qr.png";
    a.click();
  };

  const downloadTxt = () => {
    const blob = new Blob([url], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sharetext-link.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in-up">
      <div className="glass relative w-full max-w-2xl rounded-2xl p-6 shadow-card glow">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-gradient-primary glow">
            <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
          </div>
          <h2 className="text-lg font-semibold">Encrypted link created</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Share the URL and decryption key separately for maximum security.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Shareable URL</label>
            <div className="flex items-center gap-2 rounded-lg border border-glass-border bg-background/40 p-2">
              <input
                ref={inputRef}
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-transparent px-2 py-1.5 text-xs font-mono outline-none"
              />
              <button
                onClick={copy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:scale-[1.03] glow"
              >
                {copied ? <Check className="h-3.5 w-3.5 animate-fade-in-up" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              🔑 Decryption Key <span className="text-destructive font-semibold">(share separately!)</span>
            </label>
            <div className="flex items-center gap-2 rounded-lg border-2 border-primary/40 bg-primary/5 p-2.5">
              <input
                readOnly
                value={decryptionKey}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-transparent px-2 text-center text-2xl font-bold tracking-[0.3em] outline-none"
              />
              <button
                onClick={copyKey}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:scale-[1.03] glow"
              >
                {keyCopied ? <Check className="h-3.5 w-3.5 animate-fade-in-up" /> : <Copy className="h-3.5 w-3.5" />}
                {keyCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-foreground">
            <strong>Important:</strong> Share URL and key through different channels (e.g., URL via email, key via SMS).
          </span>
        </div>

        <details className="mt-3 rounded-lg border border-glass-border bg-background/20">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium hover:bg-background/40 transition rounded-lg">
            📱 Show QR Code & Download Options
          </summary>
          <div className="border-t border-glass-border p-3">
            <div className="flex items-center justify-center rounded-lg border border-glass-border bg-white p-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code" className="h-40 w-40" />
              ) : (
                <div className="grid h-40 w-40 place-items-center text-muted-foreground">
                  <QrCode className="h-6 w-6 animate-pulse" />
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={downloadQr}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-glass-border bg-secondary/60 px-3 py-1.5 text-xs font-medium hover:bg-secondary transition"
              >
                <Download className="h-3.5 w-3.5" /> QR Code
              </button>
              <button
                onClick={downloadTxt}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-glass-border bg-secondary/60 px-3 py-1.5 text-xs font-medium hover:bg-secondary transition"
              >
                <Download className="h-3.5 w-3.5" /> Text File
              </button>
            </div>
          </div>
        </details>

        <button
          onClick={onCreateAnother}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-glass-border bg-secondary/40 px-4 py-2 text-xs font-medium hover:bg-secondary transition"
        >
          <Plus className="h-3.5 w-3.5" /> Create Another
        </button>
      </div>
    </div>
  );
}
