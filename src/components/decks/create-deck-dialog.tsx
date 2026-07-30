"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createDeck } from "@/lib/decks/actions";
import { MAX_PRIVATE_DECKS } from "@/lib/decks/limits";
import { SCRYFALL_BROWSE_FORMATS } from "@/lib/formats/scryfall-formats";

const formatItems = SCRYFALL_BROWSE_FORMATS.map((row) => ({
  value: row.value,
  label: row.label,
}));

type CreateDeckDialogProps = {
  atLimit: boolean;
};

/**
 * Primary “New deck” control — opens a compact sheet with name + format.
 */
export function CreateDeckDialog({ atLimit }: CreateDeckDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<string>("modern");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setFormat("modern");
    setError(null);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createDeck({ name, format });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.push(`/decks/${result.id}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        disabled={atLimit}
        title={
          atLimit
            ? `Private deck limit reached (${MAX_PRIVATE_DECKS})`
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        New deck
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          size="sm"
          className="max-h-[85dvh] gap-0 overflow-hidden bg-background p-0"
        >
          <SheetHeader className="shrink-0 px-4 py-4 sm:px-6">
            <SheetTitle>New deck</SheetTitle>
            <SheetDescription>
              Choose a name and format. You can edit the list next.
            </SheetDescription>
          </SheetHeader>

          <form
            id="create-deck-form"
            onSubmit={onSubmit}
            className="flex flex-col gap-4 overflow-y-auto px-4 py-2 sm:px-6"
          >
            <div className="space-y-1.5">
              <label htmlFor="deck-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="deck-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Modern deck"
                maxLength={80}
                required
                disabled={pending}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deck-format" className="text-sm font-medium">
                Format
              </label>
              <Select
                value={format}
                onValueChange={(next) => {
                  if (next != null) setFormat(next);
                }}
                items={formatItems}
                disabled={pending}
              >
                <SelectTrigger id="deck-format" className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {formatItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-deck-form"
              disabled={pending || !name.trim()}
            >
              {pending ? "Creating…" : "Create deck"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
