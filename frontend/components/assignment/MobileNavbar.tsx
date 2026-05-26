"use client";

import React from "react";

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNavbar({
  activeTab,
  onTabChange
}: MobileNavbarProps) {
  const navItems = [
    { id: "home", label: "Home", iconPath: "/icons/mobile_home.svg" },
    {
      id: "assignments",
      label: activeTab === "assignments" ? "Assignments" : "My Groups",
      iconPath: "/icons/mobile_assignments.svg"
    },
    { id: "library", label: "Library", iconPath: "/icons/mobile_library.svg" },
    { id: "toolkit", label: "AI Toolkit", iconPath: "/icons/mobile_ai_toolkit.svg" },
  ];

  return (
    <nav className="flex lg:hidden items-center justify-around bg-[#111111]/95 backdrop-blur-md text-zinc-400 py-3.5 px-4 rounded-[28px] border border-zinc-800/80 fixed bottom-4 left-4 right-4 z-20 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || (item.id === "toolkit" && activeTab === "toolkit");
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${isActive ? "text-white scale-105" : "hover:text-zinc-200 hover:scale-102"
              }`}
          >
            <img
              src={item.iconPath}
              alt={item.label}
              className={`w-5 h-5 transition-all ${isActive ? "opacity-100 brightness-200" : "opacity-60"}`}
            />
            <span className={`text-[10px] tracking-tight leading-none ${isActive ? "font-bold" : "font-semibold"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
