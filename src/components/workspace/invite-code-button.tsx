"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function InviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      aria-label={copied ? "Invite code copied" : "Copy invite code"}
      className="h-8 gap-2 px-2 text-xs"
      onClick={copyCode}
      size="sm"
      title="Copy invite code"
      variant="ghost"
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span className="font-mono font-medium">{code}</span>
    </Button>
  );
}
