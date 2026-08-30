import { Card } from "./ui/card";
import { Link, Users, Calendar, FileText, Settings, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const links = [
  { icon: Users, label: "Team Directory", href: "#" },
  { icon: Calendar, label: "Events Calendar", href: "#" },
  { icon: FileText, label: "Company Handbook", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

export function QuickLinks() {
  return (
    <Card className="p-4 card-elevated">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link className="w-4 h-4 text-purple-600" />
        <h2 className="text-base font-semibold text-foreground">
          Quick Links
        </h2>
      </div>

      {/* Links */}
      <div className="space-y-2">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <a
              key={index}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition"
            >
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-sm">
                <Icon className="w-4 h-4" />
              </div>

              <span className="flex-1 font-medium">
                {link.label}
              </span>

              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          );
        })}
      </div>
    </Card>
  );
}
