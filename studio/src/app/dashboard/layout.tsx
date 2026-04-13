"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/projects", label: "Projects", icon: "📁" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("gc_token");
    if (!token) router.push("/auth");
  }, [router]);

  const logout = () => {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user");
    router.push("/auth");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-xs font-bold">G</div>
            <span className="font-semibold text-sm">GeoCollect</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Studio</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${path === n.href ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            ↩ Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
