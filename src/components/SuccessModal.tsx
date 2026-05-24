import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, QrCode, X, AlertTriangle, Plus } from "lucide-react";

export function SuccessModal({
  url,
  onClose,
  onCreateAnother,
}: {
  url: string;
  onClose: () => void;
  onCreateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
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
      <div className="glass relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-card glow">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary glow">
            <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-semibold">Encrypted link created</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anyone with this link can decrypt the text in their browser.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-glass-border bg-background/40 p-2">
          <input
            ref={inputRef}
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full bg-transparent px-2 py-2 text-sm font-mono outline-none"
          />
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:scale-[1.03] glow"
          >
            {copied ? <Check className="h-4 w-4 animate-fade-in-up" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center rounded-xl border border-glass-border bg-white p-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code" className="h-56 w-56" />
          ) : (
            <div className="grid h-56 w-56 place-items-center text-muted-foreground">
              <QrCode className="h-8 w-8 animate-pulse" />
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={downloadQr}
            className="flex items-center justify-center gap-2 rounded-lg border border-glass-border bg-secondary/60 px-3 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            <Download className="h-4 w-4" /> QR Code
          </button>
          <button
            onClick={downloadTxt}
            className="flex items-center justify-center gap-2 rounded-lg border border-glass-border bg-secondary/60 px-3 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            <Download className="h-4 w-4" /> Text File
          </button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground/90">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>Save this link — it can't be recovered if lost.</span>
        </div>

        <button
          onClick={onCreateAnother}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-glass-border bg-secondary/40 px-4 py-2.5 text-sm font-medium hover:bg-secondary transition"
        >
          <Plus className="h-4 w-4" /> Create Another
        </button>
      </div>
    </div>
  );
}
