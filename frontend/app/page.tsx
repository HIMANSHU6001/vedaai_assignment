"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/assignment/Sidebar";
import Header from "@/components/assignment/Header";
import MobileHeader from "@/components/assignment/MobileHeader";
import MobileNavbar from "@/components/assignment/MobileNavbar";
import AssignmentList from "@/components/assignment/AssignmentList";
import CreateAssignment from "@/components/assignment/CreateAssignment";
import QuestionPaperPreview from "@/components/assignment/QuestionPaperPreview";
import { useAssignmentStore } from "@/store/assignmentStore";

export default function Home() {
  const {
    viewState,
    setViewState,
    currentAssignmentId,
    setCurrentAssignmentId,
    fetchAssignments
  } = useAssignmentStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all assignments on initial mount to populate global cache and badge count
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Derive page titles
  const getHeaderTitle = () => {
    switch (viewState) {
      case "list":
        return "Assignments";
      case "create":
        return "Create Assignment";
      case "preview":
        return "Assignment View";
      default:
        return "VedaAI";
    }
  };

  const getCreateButtonText = () => {
    return viewState === "preview" ? "AI Teacher's Toolkit" : "Create Assignment";
  };

  const handleBack = () => {
    if (viewState === "preview") {
      setViewState("list");
      setCurrentAssignmentId(null);
    } else if (viewState === "create") {
      setViewState("list");
    } else {
      setViewState("list");
    }
  };

  /** Called by CreateAssignment after successful API submission */
  const handleAssignmentCreated = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setViewState("preview");
    // Refresh list to cache the newly created assignment
    fetchAssignments();
  };

  /** Called by AssignmentList when clicking a completed assignment */
  const handleViewAssignment = (assignmentId: string) => {
    setCurrentAssignmentId(assignmentId);
    setViewState("preview");
  };

  return (
    <div className="flex w-full min-h-screen bg-linear-to-b from-[#EEEEEE] to-[#DADADA] text-gray-900 font-sans antialiased overflow-x-hidden">
      {/* 1. Desktop Sidebar */}
      <Sidebar
        activeTab={viewState === "list" ? "assignments" : "toolkit"}
        onTabChange={(tab) => {
          if (tab === "assignments" || tab === "home") setViewState("list");
        }}
        onCreateClick={() => setViewState("create")}
        createButtonText={getCreateButtonText()}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Desktop Header */}
        <Header
          title={getHeaderTitle()}
          onBack={handleBack}
          showBack={viewState !== "list"}
        />

        {/* Mobile Top Header */}
        <MobileHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />


        {/* Active Component State View */}
        <main className="flex-1 flex flex-col min-w-0">
          {viewState === "list" && (
            <AssignmentList
              onBack={handleBack}
              onCreateAssignment={() => setViewState("create")}
              onViewAssignment={handleViewAssignment}
            />
          )}

          {viewState === "create" && (
            <CreateAssignment
              onBack={handleBack}
              onNext={handleAssignmentCreated}
            />
          )}

          {viewState === "preview" && (
            <QuestionPaperPreview
              assignmentId={currentAssignmentId}
              onBack={handleBack}
            />
          )}
        </main>

        {/* Mobile Bottom Navbar */}
        <MobileNavbar
          activeTab={viewState === "list" ? "assignments" : "toolkit"}
          onTabChange={(tab) => {
            if (tab === "assignments" || tab === "home") setViewState("list");
            if (tab === "toolkit") setViewState("create");
          }}
        />
      </div>

      {/* Mobile Menu Drawer (simple placeholder for responsiveness) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-64 h-full bg-white p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/Logo.svg"
                    alt="VedaAI Logo"
                    className="h-8 w-auto select-none"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fb = e.currentTarget.parentElement?.querySelector(".logo-fallback");
                      if (fb) (fb as HTMLElement).style.display = "flex";
                    }}
                  />
                  <div className="logo-fallback hidden w-8 h-8 bg-orange-600 rounded-lg items-center justify-center text-white font-extrabold text-lg">
                    V
                  </div>
                  <span className="text-xl font-bold tracking-tight text-zinc-950">VedaAI</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-zinc-500 hover:text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
