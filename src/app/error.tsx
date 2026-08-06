"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { siteContainerClassName } from "@/lib/ui/layout";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`${siteContainerClassName} flex flex-col items-start py-16 lg:py-24`}>
      <p className="text-sm font-medium tracking-wide text-primary">Error</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        This is on us, not you. Try again, or head back home if it keeps happening.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Button size="lg" type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back home
        </Button>
      </div>
    </div>
  );
}
