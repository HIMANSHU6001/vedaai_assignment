"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import DownloadExamButton from "@/components/pdf/DownloadExamButton";

import { getResult, triggerGeneration } from "@/lib/api";
import type { ExamPayload, ExamData } from "@/types/exam";
import { useAssignmentStore } from "@/store/assignmentStore";

interface QuestionPaperPreviewProps {
  assignmentId: string | null;
  onBack?: () => void;
}

export default function QuestionPaperPreview({
  assignmentId,
  onBack,
}: QuestionPaperPreviewProps) {
  const { assignments } = useAssignmentStore();
  const currentAssignment = assignments.find((a) => a._id === assignmentId);
  const socketStatus = currentAssignment?.status || "idle";
  const socketError = currentAssignment?.errorMessage || null;
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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

  // Fetch result immediately on mount
  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // Fetch result when socket signals "done"
  useEffect(() => {
    if (socketStatus === "done") {
      fetchResult();
    }
  }, [socketStatus, fetchResult]);

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
        <button onClick={onBack} className="p-2 hover:bg-zinc-200/50 rounded-full text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">Assignment</h2>
      </div>

      {/* Main responsive column - Styled as a premium dark canvas like the mockup */}
      <div className="lg:-mt-6 mx-auto w-full flex flex-col gap-6 flex-1 min-h-0 lg:bg-[#5C5C5C] lg:border lg:border-zinc-550/40 lg:rounded-[32px] lg:p-8 lg:shadow-inner lg:overflow-y-auto">
        {/* ─── Processing State ─── */}
        {isProcessing && !examData && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/60 rounded-[32px] shadow-sm">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-zinc-100 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-zinc-900 rounded-full animate-spin" />
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
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-zinc-200/60 rounded-[32px] shadow-sm">
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
              className="px-6 py-3 bg-[#1C1C1C] hover:bg-zinc-800 text-white rounded-full font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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
            {/* Dark Banner Card */}
            <div className="bg-[#1C1C1C] text-white p-8 lg:p-10 rounded-[32px] flex flex-col gap-6 shadow-sm border border-zinc-800/40 select-none">
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-zinc-100">
                {`Here is the customized Question Paper for your ${examPayload.data.subject || currentAssignment?.subject || "Science"} class on "${examPayload.data.title || currentAssignment?.title || "NCERT Chapters"}":`}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <DownloadExamButton examData={examPayload} />
              </div>
            </div>

            {/* Native HTML Question Paper Sheet */}
            <div className="flex-1 bg-white rounded-[32px] lg:rounded-[40px] p-8 lg:p-16 border border-zinc-200/60 shadow-md text-zinc-900 flex flex-col select-text mx-auto w-full mb-4 overflow-y-auto">
              {/* Centered School Header */}
              <div className="flex flex-col items-center text-center mb-8 select-none">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2 leading-tight">
                  {examPayload.data.title || "Delhi Public School, Sector-4, Bokaro"}
                </h1>
                <p className="text-base lg:text-lg font-bold text-zinc-800">
                  Subject: {examPayload.data.subject || "English"}
                </p>

              </div>

              {/* Max Marks Row */}
              <div className="flex items-center justify-end pb-2 mb-6 text-sm font-bold text-zinc-800 select-none">
                <span>Maximum Marks: {examPayload.data.totalMarks || 20}</span>
              </div>

              {/* General Instructions */}
              <p className="text-xs lg:text-sm font-bold text-zinc-900 mb-6 select-none">
                All questions are compulsory unless stated otherwise.
              </p>

              {/* Student Detail Blanks */}
              <div className="flex flex-col gap-3.5 mb-10 text-xs lg:text-sm font-bold text-zinc-800 max-w-sm select-none">
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0">Name:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4"></div>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0">Roll Number:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4 max-w-[200px]"></div>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="shrink-0">Class:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4 max-w-[60px]"></div>
                  <span className="shrink-0 ml-2">Section:</span>
                  <div className="flex-1 border-b border-zinc-950 h-4 max-w-[60px]"></div>
                </div>
              </div>

              {/* Sections & Questions */}
              <div className="flex flex-col gap-8">
                {examPayload.data.sections.map((section, sIndex) => (
                  <div key={sIndex} className="flex flex-col gap-5">
                    {/* Section Centered Label */}
                    <div className="flex items-center justify-center py-1 mt-2 select-none">
                      <h2 className="text-base lg:text-lg font-black text-black uppercase tracking-wider">
                        {section.sectionLabel || `Section ${String.fromCharCode(65 + sIndex)}`}
                      </h2>
                    </div>

                    {/* Section Title & Instructions */}
                    <div className="flex flex-col gap-1 mb-2 select-none">
                      <h3 className="text-xs lg:text-sm font-extrabold text-zinc-900 uppercase tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs font-semibold italic text-zinc-400">
                        {section.instruction}
                      </p>
                    </div>

                    {/* Questions */}
                    <div className="flex flex-col gap-5">
                      {section.questions.map((q, qIndex) => {
                        const diffLabel = q.difficulty ? `[${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}] ` : "";
                        return (
                          <div key={qIndex} className="flex flex-col gap-2">
                            <div className="text-xs lg:text-sm font-semibold leading-relaxed text-zinc-900">
                              <span className="font-bold text-black select-none">{q.questionNumber}. </span>
                              <span className="font-semibold text-zinc-450 select-none">{diffLabel}</span>
                              <span>{q.text}</span>
                              <span className="font-semibold text-zinc-450 select-none ml-1.5">[{q.marks} Marks]</span>
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
              <div className="mt-8 select-none">
                <span className="text-sm font-bold text-zinc-800">
                  End of Question Paper
                </span>
              </div>

              {/* Answer Key */}
              {examPayload.data.sections.some(s => s.questions.some(q => q.answer)) && (
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-zinc-900 mb-4 select-none">
                    Answer Key:
                  </h2>
                  <div className="flex flex-col gap-3.5">
                    {examPayload.data.sections.flatMap(section => section.questions).map((q, qIndex) =>
                      q.answer ? (
                        <div key={`ans-${q.questionNumber || qIndex}`} className="text-sm leading-relaxed text-zinc-700">
                          <span className="font-semibold text-zinc-800 select-none">{q.questionNumber || qIndex + 1}. </span>
                          <span>{q.answer}</span>
                        </div>
                      ) : null
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
