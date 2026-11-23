import { cn } from "@/lib/utils";

interface ForgeMarkProps extends React.SVGProps<SVGSVGElement> {
  /** Render the emerald spark chip. Defaults to true. */
  spark?: boolean;
}

/**
 * The Forge mark: a geometric "F" struck from a bar of metal, with a spark
 * flying off. Drawn in `currentColor` so it adapts to any surface / theme;
 * the spark keeps a fixed emerald so the brand reads consistently.
 */
export function ForgeMark({ spark = true, className, ...props }: ForgeMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
      {...props}
    >
      <path
        d="M9 7.5C9 6.67157 9.67157 6 10.5 6H22.5C23.3284 6 24 6.67157 24 7.5C24 8.32843 23.3284 9 22.5 9H12V14H19.5C20.3284 14 21 14.6716 21 15.5C21 16.3284 20.3284 17 19.5 17H12V25C12 25.8284 11.3284 26.5 10.5 26.5C9.67157 26.5 9 25.8284 9 25V7.5Z"
        fill="currentColor"
      />
      {spark && (
        <path
          d="M23.5 18.5L27 22L23.5 25.5L20 22L23.5 18.5Z"
          className="fill-success"
        />
      )}
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  withWordmark?: boolean;
  spark?: boolean;
}

export function Logo({
  className,
  markClassName,
  withWordmark = true,
  spark = true,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ForgeMark spark={spark} className={cn("h-5 w-5", markClassName)} />
      {withWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Forge
        </span>
      )}
    </span>
  );
}
