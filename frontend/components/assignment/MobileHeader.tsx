"use client";

import React, { useState } from "react";
import { Bell, Menu, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useRouter } from "next/navigation";

interface MobileHeaderProps {
  onMenuToggle?: () => void;
}

export default function MobileHeader({
  onMenuToggle
}: MobileHeaderProps) {
  const router = useRouter();
  const { setViewState, setCurrentAssignmentId } = useAssignmentStore();
  const [openNotifications, setOpenNotifications] = useState(false);
  const { activeJobs, removeJob } = useJobStore();

  return (
    <header className="flex lg:hidden items-center justify-between mx-4 mt-3 mb-2 px-4 py-2.5 bg-white rounded-[20px] shadow-sm border border-zinc-200/30 sticky top-3 z-20 select-none shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <img 
          src="/Logo.svg" 
          alt="VedaAI Logo" 
          className="h-7 w-auto select-none" 
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fb = e.currentTarget.parentElement?.querySelector(".logo-fallback");
            if (fb) (fb as HTMLElement).style.display = "flex";
          }}
        />
        <div className="logo-fallback hidden w-7 h-7 bg-orange-600 rounded items-center justify-center text-white font-extrabold text-base">
          V
        </div>
        <span className="text-lg font-black tracking-tight text-zinc-950">VedaAI</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <div className="relative">
          <button 
            onClick={() => setOpenNotifications(!openNotifications)}
            className="relative p-2 text-zinc-650 rounded-full transition-colors cursor-pointer hover:bg-zinc-50 active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {activeJobs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white border-2 border-white animate-pulse">
                {activeJobs.length}
              </span>
            )}
          </button>

          {openNotifications && (
            <>
              {/* Overlay backdrop to click-to-close */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpenNotifications(false)}
              />
              {/* Notification panel */}
              <div className="absolute right-0 mt-3 w-[calc(100vw-2.5rem)] sm:w-80 bg-white border border-zinc-200/90 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-2.5">
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider">AI Generation Tasks</h4>
                  <span className="text-[10px] font-bold text-zinc-400">{activeJobs.length} items</span>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
                  {activeJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <span className="text-2xl mb-1.5 select-none">🔔</span>
                      <p className="text-xs font-bold text-zinc-800">No background tasks</p>
                      <p className="text-[10px] text-zinc-400/80 mt-0.5 leading-relaxed">Your generated assignments will appear here</p>
                    </div>
                  ) : (
                    activeJobs.map((job) => (
                      <div
                        key={job.assignmentId}
                        className="flex items-center justify-between p-2.5 bg-zinc-50/50 hover:bg-zinc-50 rounded-xl border border-zinc-100 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                          <span className="text-xs font-extrabold text-zinc-900 truncate">
                            {job.title}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {job.status === "processing" && (
                              <>
                                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Generating...</span>
                              </>
                            )}
                            {job.status === "done" && (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Ready</span>
                              </>
                            )}
                            {job.status === "failed" && (
                              <>
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Failed</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {job.status === "done" && (
                            <button
                              onClick={() => {
                                setCurrentAssignmentId(job.assignmentId);
                                setViewState("preview");
                                setOpenNotifications(false);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-[10px] font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              View
                            </button>
                          )}
                          <button
                            onClick={() => removeJob(job.assignmentId)}
                            className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="relative w-8 h-8 rounded-full border border-zinc-150 overflow-hidden shrink-0 flex items-center justify-center">
          <img 
            src="/Avatar.png" 
            alt="John Doe" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
              if (fb) (fb as HTMLElement).style.display = "flex";
            }}
          />
          <div className="avatar-fallback hidden absolute inset-0 bg-orange-55 items-center justify-center text-xs font-bold text-orange-700">
            JD
          </div>
        </div>

        {/* Hamburger Menu */}
        <button 
          onClick={onMenuToggle}
          className="p-2 text-zinc-700 rounded-full transition-colors cursor-pointer hover:bg-zinc-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
