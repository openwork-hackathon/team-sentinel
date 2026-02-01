"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

interface CopyCodeBlockProps {
  /** The code string to display and copy */
  code: string;
  /** Optional language label (e.g. "bash", "json") */
  language?: string;
  /** Optional label above the code block */
  label?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Compact single-line style */
  inline?: boolean;
}

export function CopyCodeBlock({
  code,
  language,
  label,
  lineNumbers = false,
  inline = false,
}: CopyCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1.5 group">
        <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </span>
    );
  }

  const lines = code.split("\n");

  return (
    <div className="group relative rounded-lg border border-border bg-[hsl(var(--card))] overflow-hidden">
      {/* Header bar */}
      {(label || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-medium">
            {label || language}
          </span>
          <CopyBtn copied={copied} onClick={handleCopy} />
        </div>
      )}

      {/* Code area */}
      <div className="relative">
        {/* Copy button (shown when no header) */}
        {!label && !language && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyBtn copied={copied} onClick={handleCopy} />
          </div>
        )}

        <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="block">
                {lineNumbers && (
                  <span className="inline-block w-8 text-right mr-4 text-muted-foreground/40 select-none">
                    {i + 1}
                  </span>
                )}
                {line}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

/* ── Internal copy button ── */
function CopyBtn({
  copied,
  onClick,
}: {
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
        ${
          copied
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Copy
        </>
      )}
    </button>
  );
}
