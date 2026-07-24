"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SignInProviders = {
  hasGoogle: boolean;
  hasDiscord: boolean;
  hasEmail: boolean;
};

type OpenSignInOptions = {
  /** Relative path to return to after OAuth / magic link. */
  callbackUrl?: string;
};

type SignInSheetContextValue = {
  openSignIn: (options?: OpenSignInOptions) => void;
  closeSignIn: () => void;
};

const SignInSheetContext = createContext<SignInSheetContextValue | null>(null);

function resolveCallbackUrl(explicit?: string): string {
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//")) {
    return explicit;
  }
  if (typeof window === "undefined") {
    return "/collection";
  }
  return `${window.location.pathname}${window.location.search}` || "/collection";
}

type SignInSheetProviderProps = SignInProviders & {
  children: ReactNode;
};

/** Global sign-in sheet — primary UX; `/signin` bridges here for Auth.js `pages.signIn`. */
export function SignInSheetProvider({
  children,
  hasGoogle,
  hasDiscord,
  hasEmail,
}: SignInSheetProviderProps) {
  const [open, setOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/collection");

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    setCallbackUrl(resolveCallbackUrl(options?.callbackUrl));
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openSignIn, closeSignIn }),
    [openSignIn, closeSignIn],
  );

  return (
    <SignInSheetContext.Provider value={value}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          size="sm"
          className="max-h-[85dvh] gap-0 overflow-y-auto bg-background p-0"
        >
          <SheetHeader className="shrink-0 px-4 py-4 sm:px-6">
            <SheetTitle>Sign in</SheetTitle>
            <SheetDescription>
              Use Google, Discord, or a magic link to access your collection.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8 sm:px-6">
            <SignInForm
              callbackUrl={callbackUrl}
              hasGoogle={hasGoogle}
              hasDiscord={hasDiscord}
              hasEmail={hasEmail}
            />
          </div>
        </SheetContent>
      </Sheet>
    </SignInSheetContext.Provider>
  );
}

export function useSignInSheet(): SignInSheetContextValue {
  const ctx = useContext(SignInSheetContext);
  if (!ctx) {
    throw new Error("useSignInSheet must be used within SignInSheetProvider");
  }
  return ctx;
}
