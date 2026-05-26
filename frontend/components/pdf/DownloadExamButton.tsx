"use client";

import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
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
        className={`inline-flex items-center justify-center rounded-full bg-zinc-800 text-zinc-500 px-6 py-2.5 font-bold text-sm shadow-xs cursor-not-allowed ${className}`}
      >
        <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></span>
        <span className="ml-2">Preparing PDF...</span>
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
              className={`inline-flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 px-6 py-2.5 font-bold text-sm shadow-xs cursor-not-allowed ${className}`}
            >
              <span className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></span>
              <span className="ml-2">Generating PDF...</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-50 text-zinc-950 font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 px-6 py-2.5 text-sm ${className}`}
          >
            <img src="/icons/FileSparkle.svg" className="w-4.5 h-5 select-none shrink-0" alt="" />
            <span>Download as PDF</span>
          </button>
        );
      }}
    </PDFDownloadLink>
  );
}
