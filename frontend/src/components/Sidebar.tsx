"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PhoneCall, Settings, Mic2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Agents", href: "/agents", icon: Users },
    { name: "Campaigns", href: "/campaigns", icon: PhoneCall },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Mic2 className="w-6 h-6 text-cyan-400 mr-2" />
        <span className="font-bold text-lg tracking-wider text-white">AETHER<span className="text-cyan-400">.ai</span></span>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_#22d3ee]" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-cyan-400" : "text-gray-500"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
            AD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-500">Enterprise Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
