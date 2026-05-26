"use client";

import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { ExamPayload } from "@/types/exam";
import ExamPDF from "./ExamPDF";

interface DownloadExamButtonProps {
  examData: ExamPayload;
  className?: string;
}

export default function DownloadExamButton({
  examData,
  className = ""
}: DownloadExamButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedFileName = `${examData.data.title.trim().replace(/\s+/g, "_")}_Paper.pdf`;

  if (!isMounted) {
    return (
      <button
        disabled
        className={`inline-flex items-center justify-center rounded-full bg-zinc-700 text-zinc-400 p-3.5 sm:px-5 sm:py-2.5 font-extrabold text-xs shadow-xs cursor-not-allowed ${className}`}
      >
        <span className="w-3.5 h-3.5 border-2 border-zinc-550 border-t-zinc-200 rounded-full animate-spin"></span>
        <span className="hidden sm:inline ml-2">Preparing PDF...</span>
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ExamPDF examData={examData} />}
      fileName={formattedFileName}
      style={{ textDecoration: "none" }}
    >
      {({ blob, url, loading, error }) => {
        if (loading) {
          return (
            <button
              disabled
              className={`inline-flex items-center justify-center rounded-full bg-zinc-700 text-zinc-300 p-3.5 sm:px-5 sm:py-2.5 font-extrabold text-xs shadow-xs cursor-not-allowed ${className}`}
            >
              <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></span>
              <span className="hidden sm:inline ml-2">Generating PDF...</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-black shadow-xs transition-colors cursor-pointer active:scale-95 p-3.5 sm:px-5 sm:py-2.5 text-xs ${className}`}
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline ml-2">Download as PDF</span>
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}
