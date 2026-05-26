"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ExamPayload } from "@/types/exam";
import ExamPDF from "./ExamPDF";

// Dynamically import PDFViewer with SSR disabled — it requires browser APIs
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface PDFPreviewViewerProps {
  examData: ExamPayload;
}

export default function PDFPreviewViewer({ examData }: PDFPreviewViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <span className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-400">Loading PDF preview…</span>
        </div>
      </div>
    );
  }

  return (
    <PDFViewer
      width="100%"
      height="100%"
      style={{
        border: "none",
        borderRadius: "16px",
        minHeight: "600px",
      }}
      showToolbar={true}
    >
      <ExamPDF examData={examData} />
    </PDFViewer>
  );
}
