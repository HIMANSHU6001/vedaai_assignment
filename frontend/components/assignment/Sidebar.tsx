"use client";

import React from "react";
import {
  Home,
  Users,
  ClipboardList,
  Sparkles,
  BookOpen,
  Settings
} from "lucide-react";

import { useAssignmentStore } from "@/store/assignmentStore";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onCreateClick,
  createButtonText = "Create Assignment"
}: SidebarProps) {
  const { assignments } = useAssignmentStore();
  const assignmentCount = assignments.length > 0 ? assignments.length : undefined;

  const menuItems = [
    { id: "home", label: "Home", svg: "home" },
    { id: "groups", label: "My Groups", svg: "my_groups" },
    { id: "assignments", label: "Assignments", svg: "assignments", badge: assignmentCount },
    { id: "toolkit", label: "AI Teacher's Toolkit", svg: "book" },
    { id: "library", label: "My Library", svg: "library" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 h-[calc(100vh-2rem)] bg-white border rounded-3xl my-4 ml-4 p-5 justify-between shadow-2xl shrink-0 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Section */}
        <div className="flex items-center gap-2 px-1">
          <img
            src="/Logo.svg"
            alt="VedaAI Logo"
            className="h-7 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(".logo-fallback");
              if (fb) (fb as HTMLElement).style.display = "flex";
            }}
          />
          <div className="logo-fallback hidden w-7 h-7 bg-zinc-950 rounded-lg items-center justify-center text-white font-extrabold text-base">
            V
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-950">VedaAI</span>
        </div>

        {/* Action Button: matches dark grey pill style from mockup */}
        <div className="w-full rounded-full p-[3px] bg-linear-to-b from-[#FF7950] to-[#C0350A]">
          <button
            onClick={onCreateClick}
            className="w-full py-2 px-4 bg-[#2C2C2C] hover:bg-zinc-800 text-white rounded-full font-sans text-sm flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
          >
            <img
              src="/Sparkel.svg"
              alt="Sparkle"
              className="w-4 h-4 shrink-0"
            />

            <span>{createButtonText}</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${isActive
                  ? "bg-[#F3F4F6] text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 transition-colors ${isActive ? "bg-zinc-950" : "bg-zinc-400 group-hover:bg-zinc-950"}`}
                    style={{
                      maskImage: `url(/icons/${item.svg}.svg)`,
                      WebkitMaskImage: `url(/icons/${item.svg}.svg)`,
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center",
                    }}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[9px] font-black bg-orange-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col gap-4">
        {/* Settings */}
        <button
          onClick={() => onTabChange("settings")}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeTab === "settings"
            ? "bg-[#F3F4F6] text-zinc-950"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </button>

        {/* School Footer Card */}
        <div className="flex items-center bg-[#F0F0F0] gap-3 p-3 rounded-2xl">
          <img
            src="/Avatar.png"
            alt="John Doe"
            className="w-12 h-12 rounded-full object-cover shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
              if (fb) (fb as HTMLElement).style.display = "flex";
            }}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-extrabold text-zinc-900 truncate">
              Delhi Public School
            </span>
            <span className="text-xs text-zinc-400 font-bold truncate mt-0.5">
              Bokaro Steel City
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
