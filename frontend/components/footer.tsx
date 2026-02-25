export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <p className="font-mono text-xs tracking-wider text-muted-foreground">
          {"SOLUX SOLAR"} &mdash; ENERGY SYSTEMS READY
        </p>
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground/50">
          &copy; {new Date().getFullYear()} SOLUX SOLAR. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  )
}
