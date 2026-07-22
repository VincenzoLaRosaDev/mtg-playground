"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { importCollectionText } from "@/lib/collection/actions";
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

/** Desktop (md+) with fine pointer: actions in the header. Mobile / touch: footer. */
const SHEET_ACTIONS_IN_HEADER_CLASS = "hidden md:pointer-fine:inline-flex";
const SHEET_ACTIONS_IN_FOOTER_CLASS = "flex md:pointer-fine:hidden";

export function CollectionImportPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("1,MH2,240,foil\n");
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handleImport() {
    setSummary(null);
    setErrors([]);
    startTransition(async () => {
      const result = await importCollectionText(text);
      if ("ok" in result && result.ok === false) {
        setErrors([result.error]);
        return;
      }
      if (!("imported" in result)) return;
      setSummary(`Imported ${result.imported} row(s).`);
      const nextErrors = [
        ...result.parseErrors.map((e) => `Line ${e.lineNumber}: ${e.message} (${e.raw})`),
        ...result.resolveErrors.map((e) => `Line ${e.lineNumber}: ${e.message} (${e.raw})`),
      ];
      setErrors(nextErrors);
      router.refresh();
    });
  }

  const importDisabled = pending || !text.trim();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button type="button" variant="outline" />}>
        Import
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader
          className={cn(
            siteContainerClassName,
            "shrink-0 py-4 pr-12",
            SHEET_LIST_RULE_CLASS,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>Import collection</SheetTitle>
              <SheetDescription>
                Paste lines as <code className="text-xs">qty,set,cn,finish</code> — e.g.{" "}
                <code className="text-xs">1,MH2,240,foil</code>. Unresolved rows are reported.
              </SheetDescription>
            </div>
            <Button
              type="button"
              size="sm"
              className={cn(SHEET_ACTIONS_IN_HEADER_CLASS, "shrink-0 self-start")}
              disabled={importDisabled}
              onClick={handleImport}
            >
              Import rows
            </Button>
          </div>
        </SheetHeader>

        <div className={cn(siteContainerClassName, "min-h-0 flex-1 space-y-4 overflow-y-auto py-4")}>
          <div className="space-y-1.5">
            <Label htmlFor="import-text">CSV / paste</Label>
            <textarea
              id="import-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              spellCheck={false}
            />
          </div>

          {summary ? <p className="text-sm text-muted-foreground">{summary}</p> : null}
          {errors.length > 0 ? (
            <ul className="space-y-1 text-sm text-destructive">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div
          className={cn(
            siteContainerClassName,
            SHEET_ACTIONS_IN_FOOTER_CLASS,
            "shrink-0 border-t border-border py-4",
          )}
        >
          <Button
            type="button"
            size="sm"
            disabled={importDisabled}
            onClick={handleImport}
          >
            Import rows
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
