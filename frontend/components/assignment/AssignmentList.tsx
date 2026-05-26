"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  Search,
  MoreVertical,
  Plus,
  ArrowLeft,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import type { Assignment } from "@/types/exam";
import { cn } from "@/lib/utils";


interface AssignmentListProps {
  onBack?: () => void;
  onCreateAssignment: () => void;
  onViewAssignment: (assignmentId: string) => void;
}

/** Format ISO date string to DD-MM-YYYY */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return iso;
  }
}

/** Status badge config */
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; classes: string }> = {
  pending: {
    icon: <Clock className="w-3 h-3" />,
    label: "Pending",
    classes: "bg-amber-50 text-amber-600 border-amber-200",
  },
  processing: {
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: "Generating...",
    classes: "bg-blue-50 text-blue-600 border-blue-200",
  },
  done: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: "Ready",
    classes: "bg-green-50 text-green-600 border-green-200",
  },
  failed: {
    icon: <AlertCircle className="w-3 h-3" />,
    label: "Failed",
    classes: "bg-red-50 text-red-600 border-red-200",
  },
};

import { useAssignmentStore } from "@/store/assignmentStore";

export default function AssignmentList({
  onBack,
  onCreateAssignment,
  onViewAssignment
}: AssignmentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("assigned_desc");

  const {
    assignments,
    isLoading,
    error: fetchError,
    fetchAssignments,
    deleteAssignment
  } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment(id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete assignment");
    } finally {
      setActiveMenuId(null);
    }
  };

  const filteredAssignments = assignments
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "assigned_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "assigned_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "due_soonest") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "due_latest") {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      return 0;
    });

  const isEmpty = !isLoading && !fetchError && assignments.length === 0;

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-6 bg-transparent min-h-0 select-none">
      {/* Mobile Title Header – hidden when empty */}
      {!isEmpty && (
        <div className="relative flex lg:hidden items-center justify-center mb-6 mt-1 px-1 shrink-0">
          <button
            onClick={onBack}
            className="absolute left-0 w-10 h-10 bg-zinc-200/75 hover:bg-zinc-300/75 rounded-full text-zinc-700 flex items-center justify-center transition-all cursor-pointer border border-transparent active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-black text-zinc-800 tracking-tight">Assignments</h2>
        </div>
      )}      {/* Desktop Header area – hidden when empty */}
      {!isEmpty && (
        <div className="hidden lg:flex items-center justify-between mb-3 -mt-3 mx-auto w-full shrink-0 px-2 lg:px-0">
          <div className="flex items-start gap-3 select-none">
            <span className="w-3.5 h-3.5 bg-[#10B981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] mt-2 shrink-0 animate-pulse"></span>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-extrabold text-[#111111] tracking-tight leading-none">Assignments</h2>
              <p className="text-xs font-semibold text-zinc-400">Manage and create assignments for your classes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Outer wrapper to center floating card */}
      <div className="mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Search & Filter Bar – hidden when empty */}
        {!isEmpty && (
          <div className="flex items-center justify-between bg-white border border-zinc-200/60 rounded-2xl px-3  md:px-6 py-2 shadow-xs mb-6 shrink-0 gap-4">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-zinc-455 text-zinc-400 hover:text-zinc-800 font-bold text-xs lg:text-sm cursor-pointer shrink-0 transition-colors bg-transparent border-none outline-none py-1.5 px-3 rounded-xl hover:bg-zinc-50 active:scale-95"
              >
                <Filter className={cn("w-4 h-4", (statusFilter !== "all" || sortBy !== "assigned_desc") && "text-orange-500")} />
                <span>Filter By</span>
                {(statusFilter !== "all" || sortBy !== "assigned_desc") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                )}
              </button>

              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute left-0 mt-3 w-64 bg-white border border-zinc-200/90 shadow-2xl rounded-2xl p-4.5 z-40 animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-2 mb-3 select-none">
                      <h4 className="text-[10px] font-black text-zinc-950 uppercase tracking-wider">Filters & Sort</h4>
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setSortBy("assigned_desc");
                          setShowFilters(false);
                        }}
                        className="text-[9px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-wider cursor-pointer bg-transparent border-none"
                      >
                        Reset All
                      </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-col gap-1.5 mb-4">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Status</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { val: "all", label: "All" },
                          { val: "done", label: "Ready" },
                          { val: "processing", label: "Generating" },
                          { val: "failed", label: "Failed" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            onClick={() => setStatusFilter(item.val)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer",
                              statusFilter === item.val
                                ? "bg-zinc-900 border-zinc-900 text-white"
                                : "bg-[#FAFAFA] border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Sort by Date</span>
                      <div className="flex flex-col gap-1">
                        {[
                          { val: "assigned_desc", label: "Assigned: Newest First" },
                          { val: "assigned_asc", label: "Assigned: Oldest First" },
                          { val: "due_soonest", label: "Due: Soonest First" },
                          { val: "due_latest", label: "Due: Latest First" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() => setSortBy(opt.val)}
                            className={cn(
                              "text-left px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer",
                              sortBy === opt.val
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-650 hover:bg-zinc-55"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative w-56 max-w-sm">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#FAFAFA] border border-zinc-200 focus:border-zinc-350 focus:bg-white rounded-full text-xs font-semibold placeholder-zinc-400 outline-none transition-all text-zinc-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* List / Loading / Error / Empty State */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-transparent">
          {isLoading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white border border-zinc-200/20 rounded-[28px] animate-pulse h-40">
                  <div className="h-5 w-3/4 bg-zinc-200 rounded mb-3" />
                  <div className="h-3 w-1/2 bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
          ) : fetchError ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center max-w-lg mx-auto w-full my-auto bg-white rounded-3xl border border-zinc-200/40 p-6 shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <h3 className="text-base font-extrabold text-zinc-900 tracking-tight mb-2">
                Connection Error
              </h3>
              <p className="text-[11px] font-bold text-zinc-400 max-w-xs leading-relaxed mb-4">
                {fetchError}
              </p>
              <button
                onClick={fetchAssignments}
                className="px-4 py-2 border border-zinc-250 hover:border-zinc-800 hover:bg-gray-50 text-zinc-800 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-28 lg:pb-0">
              {filteredAssignments.map((assignment) => {
                return (
                  <div
                    key={assignment._id}
                    onClick={() => onViewAssignment(assignment._id)}
                    className="group flex flex-col justify-between p-6 bg-white border border-zinc-200/60 rounded-[28px] cursor-pointer hover:bg-zinc-50/20 hover:border-zinc-350 hover:shadow-md transition-all duration-250 min-h-[160px] relative"
                  >
                    {/* Top Row: Title, Status and Options Menu */}
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex flex-col gap-2 min-w-0 flex-1 pr-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-zinc-900 group-hover:text-zinc-800 text-lg lg:text-xl tracking-tight transition-colors truncate">
                            {assignment.title}
                          </h3>
                          {assignment.status && STATUS_CONFIG[assignment.status] && (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-black border uppercase tracking-wider shrink-0 select-none",
                              STATUS_CONFIG[assignment.status].classes
                            )}>
                              {STATUS_CONFIG[assignment.status].icon}
                              <span>{STATUS_CONFIG[assignment.status].label}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side Options menu */}
                      <div className="relative flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === assignment._id ? null : assignment._id);
                          }}
                          className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4.5 h-4.5 stroke-[2.2]" />
                        </button>

                        {activeMenuId === assignment._id && (
                          <>
                            {/* Invisible backdrop to dismiss dropdown on click outside */}
                            <div
                              className="fixed inset-0 z-10 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />
                            {/* Dropdown Card */}
                            <div
                              className="absolute right-0 top-10 bg-white border border-zinc-200/90 shadow-xl rounded-2xl p-1.5 z-20 w-40 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  onViewAssignment(assignment._id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 text-zinc-800 hover:text-zinc-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                View Assignment
                              </button>
                              <button
                                onClick={() => handleDelete(assignment._id)}
                                className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Dates spaced apart */}
                    <div className="flex items-center justify-between w-full text-sm select-none pt-4">
                      <span className="flex items-center gap-1">
                        <span className="text-zinc-950 font-semibold">Assigned on :</span>
                        <span className="text-zinc-400 ">{formatDate(assignment.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-zinc-950 font-semibold">Due :</span>
                        <span className="text-zinc-400 ">{formatDate(assignment.dueDate)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : assignments.length > 0 ? (
            /* Filter Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto w-full my-auto select-none bg-white rounded-[28px] border border-zinc-150 p-8 shadow-sm">
              <span className="text-4xl mb-3 select-none">🔍</span>
              <h3 className="text-base font-extrabold text-zinc-900 tracking-tight mb-1.5">No matching assignments</h3>
              <p className="text-xs font-semibold text-zinc-400 max-w-[240px] leading-relaxed mb-5">
                We couldn't find any assignments matching your current search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSortBy("assigned_desc");
                }}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            /* Empty State Illustration using Empty_Illustration.svg */
            <div className="flex flex-col items-center justify-center py-3 md:py-10 px-6 text-center max-w-lg mx-auto w-full md:my-auto">
              <img
                src="/Empty_Illustration.svg"
                alt="No Assignments Illustration"
                className="w-48 md:w-72 h-auto select-none mb-8"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fb = e.currentTarget.parentElement?.querySelector(".ill-fallback");
                  if (fb) (fb as HTMLElement).style.display = "block";
                }}
              />
              <div className="ill-fallback hidden text-5xl mb-4">📁</div>

              <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight mb-2">
                No assignments yet
              </h3>
              <p className="text-xs md:font-medium text-[#5E5E5E]/50 w-full md:max-w-sm leading-relaxed mb-8">
                Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>

              <button
                onClick={onCreateAssignment}
                className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-full text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Assignment</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={onCreateAssignment}
        className="lg:hidden fixed bottom-24 right-5 w-14 h-14 bg-white text-orange-500 hover:bg-zinc-50 active:scale-95 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-zinc-200/50 transition-all z-10 cursor-pointer font-black"
      >
        <Plus className="w-7 h-7 text-orange-500" />
      </button>
    </div>
  );
}
