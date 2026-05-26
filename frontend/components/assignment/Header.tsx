"use client";

import React, { useState } from "react";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useJobStore } from "@/store/useJobStore";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

export default function Header({
  title,
  onBack
}: HeaderProps) {
  const router = useRouter();
  const [openNotifications, setOpenNotifications] = useState(false);
  const { activeJobs, removeJob } = useJobStore();

  return (
    <header className="hidden lg:flex items-center justify-between px-6 py-3 backdrop-blur-sm shrink-0 bg-white border rounded-3xl my-4 mx-4 p-5 z-40">
      {/* Left side: Back arrow + Grid icon + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-100 active:scale-95 rounded-lg text-zinc-600 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-zinc-300">
          <LayoutGrid className="w-4 h-4 " size={15} strokeWidth={3} />
          <span className="text-sm font-semibold text-zinc-400">{title}</span>
        </div>
      </div>

      {/* Right side: Bell & User menu */}
      <div className="flex items-center gap-3">
        {/* Interactive Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="relative p-2.5 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors cursor-pointer active:scale-95"
          >
            <Bell className="w-5 h-5" />
            {activeJobs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white border-2 border-white animate-pulse">
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
              <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200/90 shadow-2xl rounded-[24px] p-4.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 mb-3">
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider">AI Generation Tasks</h4>
                  <span className="text-[10px] font-bold text-zinc-400">{activeJobs.length} items</span>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-0.5">
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
                        className="flex items-center justify-between p-2.5 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl border border-zinc-100 transition-colors"
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
                                router.push(`/assignments/${job.assignmentId}`);
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

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 hover:bg-zinc-50 rounded-full cursor-pointer transition-colors select-none">
          <img
            src="/Avatar.png"
            alt="John Doe"
            className="w-8 h-8 rounded-full object-cover shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
              if (fb) (fb as HTMLElement).style.display = "flex";
            }}
          />
          <div className="avatar-fallback hidden w-8 h-8 rounded-full bg-orange-100 border border-orange-200 items-center justify-center text-[10px] font-black text-orange-700 overflow-hidden shrink-0">
            JD
          </div>
          <span className="text-sm font-semibold text-zinc-700">John Doe</span>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
    </header>
  );
}

