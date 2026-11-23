import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Secondary row: tabs, filters. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && <div className="px-4 pb-2 md:px-6">{children}</div>}
    </div>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-6xl px-4 py-6 md:px-6", className)}>
      {children}
    </div>
  );
}
