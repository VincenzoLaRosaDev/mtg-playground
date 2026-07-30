"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { importDeckPaste } from "@/lib/decks/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteContainerClassName, SHEET_LIST_RULE_CLASS } from "@/lib/ui/layout";
import { cn } from "@/lib/utils";

type DeckImportPanelProps = {
  deckId: string;
};

/**
 * Paste Arena / plain-text lists into the open deck (oracle resolve).
 */
export function DeckImportPanel({ deckId }: DeckImportPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handleImport() {
    setSummary(null);
    setErrors([]);
    startTransition(async () => {
      const result = await importDeckPaste({ deckId, text });
      if (!result.ok) {
        setErrors([result.error]);
        return;
      }
      setSummary(
        `Replaced deck with ${result.imported} line(s)${
          result.skipped > 0 ? `, skipped ${result.skipped}` : ""
        }.`,
      );
      const nextErrors = [
        ...result.parseErrors.map(
          (e) => `Line ${e.lineNumber}: ${e.message} (${e.raw})`,
        ),
        ...result.resolveErrors.map(
          (e) => `Line ${e.lineNumber}: ${e.message} (${e.raw})`,
        ),
        ...result.blockErrors.map(
          (e) => `Line ${e.lineNumber}: ${e.message} (${e.raw})`,
        ),
      ];
      setErrors(nextErrors);
      if (result.imported > 0) {
        router.refresh();
        if (nextErrors.length === 0) {
          setText("");
          setOpen(false);
        }
      }
    });
  }

  const importDisabled = pending || !text.trim();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button type="button" variant="outline" className="h-8" />}
      >
        Import list
      </SheetTrigger>
      <SheetContent
        side="bottom"
        size="md"
        className="max-h-[85dvh] gap-0 overflow-hidden p-0"
      >
        <SheetHeader
          className={cn(siteContainerClassName, "shrink-0 pb-0 pt-4 pr-12")}
        >
          <SheetTitle>Import deck list</SheetTitle>
          <SheetDescription>
            Paste an Arena export or a plain{" "}
            <code className="text-xs">1 Card Name</code> list (EDHREC /
            MTGGoldfish style). This <strong>replaces</strong> the current deck
            list. Sections{" "}
            <code className="text-xs">Deck</code> /{" "}
            <code className="text-xs">Sideboard</code> /{" "}
            <code className="text-xs">Commander</code> are recognized. Cards
            resolve by oracle name — set codes are ignored.
          </SheetDescription>
          <div className={SHEET_LIST_RULE_CLASS} />
        </SheetHeader>

        <div
          className={cn(
            siteContainerClassName,
            "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 pb-8",
          )}
        >
          <div className="space-y-1.5">
            <Label htmlFor="deck-import-text">Paste</Label>
            <textarea
              id="deck-import-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              disabled={pending}
              className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 w-full min-h-48 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus-visible:ring-3 disabled:opacity-50"
              placeholder={`Deck\n1 Sol Ring\n1 Arcane Signet\n\nCommander\n1 Atraxa, Praetors' Voice`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={importDisabled}
              onClick={handleImport}
            >
              {pending ? "Replacing…" : "Replace deck"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending || !text}
              onClick={() => {
                setText("");
                setSummary(null);
                setErrors([]);
              }}
            >
              Clear
            </Button>
          </div>

          {summary ? (
            <p className="text-sm text-muted-foreground" role="status">
              {summary}
            </p>
          ) : null}
          {errors.length > 0 ? (
            <ul className="space-y-1 text-sm text-destructive">
              {errors.slice(0, 20).map((err) => (
                <li key={err}>{err}</li>
              ))}
              {errors.length > 20 ? (
                <li>…and {errors.length - 20} more</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
