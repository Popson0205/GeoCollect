"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, LayoutGrid } from "lucide-react";

const LINKS = [
  { href: "/portal",       label: "Home" },
  { href: "/content",      label: "Content" },
  { href: "/map",          label: "Map Viewer" },
  { href: "/scene",        label: "Scene Viewer" },
  { href: "/dashboards",   label: "Dashboard" },
  { href: "/organization", label: "Organization" },
];

export default function TopNav({ user }: { user?: { full_name: string } }) {
  const path = usePathname();
  const initials = user?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "FA";
  const isActive = (href: string) =>
    href === "/portal" ? (path === "/" || path === "/portal") : path.startsWith(href);

  return (
    <nav className="gc-nav">
      <Link href="/portal" className="gc-nav-logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0079c1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        GeoCollect
      </Link>
      <div className="gc-nav-links">
        {LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={`gc-nav-link ${isActive(href) ? "active" : ""}`}>{label}</Link>
        ))}
      </div>
      <div className="gc-nav-right">
        <button className="gc-nav-icon" title="Search"><Search size={15} /></button>
        <button className="gc-nav-icon" title="Notifications"><Bell size={15} /></button>
        <button className="gc-nav-icon" title="App launcher"><LayoutGrid size={15} /></button>
        <div className="gc-avatar" title={user?.full_name}>{initials}</div>
      </div>
    </nav>
  );
}
