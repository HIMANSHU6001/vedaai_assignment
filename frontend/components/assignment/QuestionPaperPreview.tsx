"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import DownloadExamButton from "@/components/pdf/DownloadExamButton";
import PDFPreviewViewer from "@/components/pdf/PDFPreviewViewer";
import { useSocket } from "@/lib/useSocket";
import { getResult, triggerGeneration } from "@/lib/api";
import type { ExamPayload, ExamData } from "@/types/exam";

interface QuestionPaperPreviewProps {
  assignmentId: string | null;
  onBack?: () => void;
}

export default function QuestionPaperPreview({
  assignmentId,
  onBack,
}: QuestionPaperPreviewProps) {
  const { status: socketStatus, error: socketError } = useSocket(assignmentId);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // ─── Polling fallback: check result every 5s if socket says "processing" for too long ───
  const [pollCount, setPollCount] = useState(0);

  const fetchResult = useCallback(async () => {
    if (!assignmentId) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await getResult(assignmentId);
      setExamData(response.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch result";
      setFetchError(msg);
    } finally {
      setIsFetching(false);
    }
  }, [assignmentId]);

  // Fetch result when socket signals "done"
  useEffect(() => {
    if (socketStatus === "done") {
      fetchResult();
    }
  }, [socketStatus, fetchResult]);

  // Polling fallback: if still processing after 10s, start polling every 5s
  useEffect(() => {
    if (socketStatus !== "processing" && socketStatus !== "connecting") return;

    const timer = setTimeout(() => {
      setPollCount((c) => c + 1);
    }, 10000); // initial delay

    return () => clearTimeout(timer);
  }, [socketStatus]);

  useEffect(() => {
    if (pollCount === 0 || !assignmentId) return;
    // Try fetching — if paper is ready, it will succeed
    const poll = async () => {
      try {
        const response = await getResult(assignmentId);
        setExamData(response.data);
      } catch {
        // Not ready yet — schedule next poll
        const timer = setTimeout(() => setPollCount((c) => c + 1), 5000);
        return () => clearTimeout(timer);
      }
    };
    poll();
  }, [pollCount, assignmentId]);

  // ─── Retry generation ───
  const handleRetry = async () => {
    if (!assignmentId) return;
    setIsRetrying(true);
    setFetchError(null);
    try {
      await triggerGeneration(assignmentId);
      // WebSocket will pick up the new job automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      setFetchError(msg);
    } finally {
      setIsRetrying(false);
    }
  };

  // ─── Prepare exam payload ───
  const examPayload: ExamPayload | null = examData ? { data: examData } : null;

  // ─── Determine what to show ───
  const isProcessing =
    !examData &&
    !fetchError &&
    socketStatus !== "failed" &&
    socketStatus !== "done";
  const hasFailed = socketStatus === "failed" || !!fetchError;

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-6 bg-transparent min-h-0 select-none">
      {/* Mobile Title Header */}
      <div className="flex lg:hidden items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-zinc-200/50 rounded-full text-zinc-705">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">Assignment</h2>
      </div>

      {/* Desktop Header bar */}
      <div className="hidden lg:flex items-center justify-between mb-5 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-200/50 rounded-full text-zinc-705 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-zinc-400">Assignment Preview</span>
        </div>
      </div>

      {/* Main responsive column */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-5 flex-1 min-h-0">
        {/* ─── Processing State ─── */}
        {isProcessing && !examData && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-zinc-200 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-zinc-800 rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight mb-2">
              Generating Your Question Paper
            </h3>
            <p className="text-xs font-bold text-zinc-400 max-w-sm text-center leading-relaxed">
              Our AI is analyzing your requirements and creating a customized exam paper. This usually takes 15–30 seconds.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
              <span className="text-[11px] font-bold text-zinc-400 animate-pulse">
                Processing with AI...
              </span>
            </div>
          </div>
        )}

        {/* ─── Error / Failed State ─── */}
        {hasFailed && !examData && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-red-50 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight mb-2">
              Generation Failed
            </h3>
            <p className="text-xs font-bold text-zinc-400 max-w-sm text-center leading-relaxed mb-6">
              {socketError || fetchError || "Something went wrong during generation."}
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-5 py-2.5 bg-[#2C2C2C] hover:bg-zinc-800 text-white rounded-full font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isRetrying ? "Retrying..." : "Retry Generation"}</span>
            </button>
          </div>
        )}

        {/* ─── Result Ready ─── */}
        {examPayload && (
          <>
            {/* Banner Card */}
            <div className="bg-[#2C2C2C] text-white p-5 lg:p-6 rounded-[24px] flex flex-col gap-4 shadow-sm border border-zinc-700/50 select-none">
              <p className="text-[13px] sm:text-sm font-semibold leading-relaxed text-zinc-200">
                Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:
              </p>
              <div className="flex items-center gap-3 sm:justify-start shrink-0">
                <DownloadExamButton examData={examPayload} />
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center justify-center gap-1.5 p-3.5 sm:px-4 sm:py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-full font-black text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Regenerate paper"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </div>
            </div>

            {/* Native HTML Question Paper Sheet */}
            <div className="flex-1 bg-white rounded-[32px] p-6 lg:p-12 border border-zinc-200/50 shadow-md text-zinc-900 flex flex-col font-sans select-text max-w-3xl mx-auto w-full mb-10 overflow-y-auto">
              {/* Centered School Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <h1 className="text-xl lg:text-2xl font-black text-black tracking-tight mb-1 leading-tight">
                  {examPayload.data.title || "Delhi Public School, Bokaro"}
                </h1>
                <p className="text-sm font-semibold text-zinc-800">
                  Subject: {examPayload.data.subject || "English"}
                </p>
                <p className="text-sm font-semibold text-zinc-800">
                  Class: 5th
                </p>
              </div>

              {/* Time Allowed & Max Marks Row */}
              <div className="flex items-center justify-between border-b border-zinc-250 pb-3 mb-4 text-xs font-black text-black">
                <span>Time Allowed: 45 minutes</span>
                <span>Maximum Marks: {examPayload.data.totalMarks}</span>
              </div>

              {/* General Instructions */}
              <p className="text-xs font-black text-black mb-5">
                All questions are compulsory unless stated otherwise.
              </p>

              {/* Student Detail Blanks */}
              <div className="flex flex-col gap-2.5 mb-8 text-xs font-bold text-zinc-800 max-w-sm">
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 select-none">Name:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4"></div>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 select-none">Roll Number:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4 max-w-[200px]"></div>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0 select-none">Class: 5th Section:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4 max-w-[120px]"></div>
                </div>
              </div>

              {/* Sections & Questions */}
              <div className="flex flex-col gap-6">
                {examPayload.data.sections.map((section, sIndex) => (
                  <div key={sIndex} className="flex flex-col gap-4">
                    {/* Section Centered Label */}
                    <div className="flex items-center justify-center py-1 mt-2">
                      <h2 className="text-base font-black text-black uppercase tracking-wider select-none">
                        {section.sectionLabel || `Section ${String.fromCharCode(65 + sIndex)}`}
                      </h2>
                    </div>

                    {/* Section Title & Instructions */}
                    <div className="flex flex-col gap-0.5 mb-2 pl-1 select-none">
                      <h3 className="text-xs font-black text-black uppercase tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-[11px] font-semibold italic text-zinc-500">
                        {section.instruction}
                      </p>
                    </div>

                    {/* Questions */}
                    <div className="flex flex-col gap-4.5 pl-1">
                      {section.questions.map((q, qIndex) => {
                        const diffLabel = q.difficulty ? `[${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}] ` : "";
                        return (
                          <div key={qIndex} className="flex flex-col gap-2">
                            <div className="text-sm font-semibold leading-relaxed text-zinc-900">
                              <span className="font-bold text-black select-none">{q.questionNumber}. </span>
                              <span className="font-bold text-zinc-550 select-none">{diffLabel}</span>
                              <span>{q.text}</span>
                              <span className="font-bold text-zinc-550 select-none ml-1.5">[{q.marks} Marks]</span>
                            </div>

                            {/* MCQ Options grid */}
                            {q.type === "mcq" && q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-6 mt-1 text-xs font-semibold text-zinc-700">
                                {q.options.map((opt, oIndex) => (
                                  <div key={oIndex} className="flex items-start gap-1">
                                    <span className="text-zinc-400 select-none">{String.fromCharCode(97 + oIndex)})</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* End of paper */}
              <div className="flex items-center justify-center py-6 mt-6 select-none">
                <span className="text-xs font-black text-red-650 tracking-wide uppercase">
                  End of Question Paper
                </span>
              </div>

              {/* Answer Key */}
              {examPayload.data.sections.some(s => s.questions.some(q => q.answer)) && (
                <div className="border-t border-dashed border-zinc-300 pt-6 mt-6">
                  <h2 className="text-sm font-black text-black underline mb-4 select-none">
                    Answer Key:
                  </h2>
                  <div className="flex flex-col gap-3 pl-1">
                    {examPayload.data.sections.map((section) =>
                      section.questions.map((q, qIndex) =>
                        q.answer ? (
                          <div key={`ans-${qIndex}`} className="text-xs leading-relaxed text-zinc-700">
                            <span className="font-black text-black select-none">{q.questionNumber}. </span>
                            <span>{q.answer}</span>
                          </div>
                        ) : null
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
