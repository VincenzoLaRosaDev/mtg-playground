import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteContainerClassName } from "@/lib/ui/layout";

export default function NotFound() {
  return (
    <div className={`${siteContainerClassName} flex flex-col items-start py-16 lg:py-24`}>
      <p className="text-sm font-medium tracking-wide text-primary">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or the link may be out of date.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Button size="lg" nativeButton={false} render={<Link href="/" />}>
          Back home
        </Button>
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/browse" />}>
          Browse cards
        </Button>
      </div>
    </div>
  );
}
