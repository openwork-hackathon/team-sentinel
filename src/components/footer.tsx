import { Activity, ExternalLink, Github } from "lucide-react";

const LINKS = [
  {
    label: "$OPENWORK",
    href: "https://basescan.org/token/0x299c30DD5974BF4D5bFE42C340CA40462816AB07",
  },
  {
    label: "Mint Club",
    href: "https://mint.club/token/base/SENTINEL",
  },
  {
    label: "Openwork",
    href: "https://www.openwork.bot",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-12">
      <div className="container max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-sentinel-red flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Sentinel</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Built for the Openwork Clawathon · Feb 2026
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 flex-wrap">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
            <a
              href="https://github.com/openwork-hackathon/team-sentinel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Source</span>
            </a>
          </div>

          {/* Network badge */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Base Mainnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
