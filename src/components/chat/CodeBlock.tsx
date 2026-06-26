import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const theme = useAppStore((state) => state.settings.theme);

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  async function copyCode() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Code copied");
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-card">
      <div className="flex h-10 items-center justify-between border-b bg-muted px-3">
        <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {language}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={copyCode} aria-label="Copy code">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "transparent",
          padding: "1rem",
          fontSize: "0.875rem",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
