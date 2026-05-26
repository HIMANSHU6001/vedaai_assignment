"use client";

import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  UploadCloud,
  CalendarPlus,
  Plus,
  Minus,
  X,
  ChevronDown,
  Mic,
  Loader2,
  FileText,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createAssignment, triggerGeneration } from "@/lib/api";
import type { QuestionType } from "@/types/exam";
import { useJobStore } from "@/store/useJobStore";
import { useAssignmentStore } from "@/store/assignmentStore";
import { toast } from "sonner";

/** Maps the UI display names to backend enum values */
const QUESTION_TYPE_MAP: Record<string, QuestionType> = {
  "Multiple Choice Questions": "mcq",
  "Short Questions": "short_answer",
  "Long Answer Questions": "long_answer",
  "True / False": "true_false",
  "Fill in the Blanks": "fill_blank",
};

const QUESTION_TYPE_OPTIONS = Object.keys(QUESTION_TYPE_MAP);

interface QuestionTypeItem {
  id: string;
  type: string;
  count: number;
  marks: number;
}

interface CreateAssignmentProps {
  onBack?: () => void;
  onNext?: (assignmentId: string) => void;
}

export default function CreateAssignment({
  onBack,
  onNext
}: CreateAssignmentProps) {
  // ─── Form State ───
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questionTypes, setQuestionTypes] = useState<QuestionTypeItem[]>([
    { id: "1", type: "Multiple Choice Questions", count: 4, marks: 4 },
    { id: "2", type: "Short Questions", count: 4, marks: 4 },
  ]);

  // ─── Submission State ───
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Question Type CRUD ───
  const updateCount = (id: string, delta: number) => {
    setQuestionTypes(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const updateMarks = (id: string, delta: number) => {
    setQuestionTypes(prev => prev.map(item => {
      if (item.id === id) {
        const newMarks = Math.max(0, item.marks + delta);
        return { ...item, marks: newMarks };
      }
      return item;
    }));
  };

  const addQuestionType = () => {
    const newId = Date.now().toString();
    setQuestionTypes(prev => [
      ...prev,
      { id: newId, type: "Multiple Choice Questions", count: 4, marks: 4 }
    ]);
  };

  const removeQuestionType = (id: string) => {
    setQuestionTypes(prev => prev.filter(item => item.id !== id));
  };

  // ─── File Handling ───
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "text/plain")) {
      setUploadedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  // ─── Computed Totals ───
  const totalQuestions = questionTypes.reduce((acc, item) => acc + item.count, 0);
  const totalMarks = questionTypes.reduce((acc, item) => acc + (item.count * item.marks), 0);

  // ─── Build & Submit Form ───
  const handleSubmit = async () => {
    setSubmitError(null);

    // Dynamic fallback for title and subject since they are hidden in the mockup UI
    const finalTitle = title.trim() || (uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, "") : "Quiz on Electricity");
    const finalSubject = subject.trim() || "English";

    if (!dueDate) return setSubmitError("Due date is required");
    if (questionTypes.length === 0) return setSubmitError("Add at least one question type");
    if (totalQuestions === 0) return setSubmitError("Total questions must be at least 1");

    setIsSubmitting(true);

    try {
      // Collect unique question type enum values
      const uniqueTypes = [...new Set(
        questionTypes.map(item => QUESTION_TYPE_MAP[item.type]).filter(Boolean)
      )];

      // Build FormData matching backend's multipart/form-data contract
      const formData = new FormData();
      formData.append("title", finalTitle);
      formData.append("subject", finalSubject);

      // Convert Selected Date to ISO string
      if (!dueDate) {
        throw new Error("Please select a due date.");
      }
      formData.append("dueDate", dueDate.toISOString());

      formData.append("questionTypes", JSON.stringify(uniqueTypes));
      formData.append("totalQuestions", totalQuestions.toString());
      formData.append("totalMarks", totalMarks.toString());
      formData.append(
        "difficultyDistribution",
        JSON.stringify({ easy: 33, medium: 34, hard: 33 })
      );

      if (additionalInfo.trim()) {
        formData.append("additionalInstructions", additionalInfo.trim());
      }

      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }

      // Step 1: Create assignment
      const { assignmentId } = await createAssignment(formData);

      // Step 2: Trigger generation
      await triggerGeneration(assignmentId);

      // Step 3: Add to global job store and show toast
      const { addJob } = useJobStore.getState();
      addJob({
        assignmentId,
        title: finalTitle,
        status: "processing",
      });

      toast.info(`Generating "${finalTitle}"`, {
        description: "We are building your assignment in the background. Feel free to use VedaAI.",
        duration: 6000,
      });

      // Refresh the list of assignments in the store so it shows up in list view immediately
      useAssignmentStore.getState().fetchAssignments();

      // Step 4: Navigate back to the list view immediately
      onBack?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(message);
      setIsSubmitting(false);
    } finally {
      // Cleanup submitting state
    }
  };

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-6 bg-transparent min-h-0 select-none">
      {/* Header for mobile */}
      <div className="relative flex lg:hidden items-center justify-center mb-5 mt-1 px-1 shrink-0">
        <button
          onClick={onBack}
          className="absolute left-0 w-10 h-10 bg-zinc-200/75 hover:bg-zinc-300/75 rounded-full text-zinc-700 flex items-center justify-center transition-all cursor-pointer border border-transparent active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-black text-zinc-800 tracking-tight">Create Assignment</h2>
      </div>

      {/* Step-based Progress Bar for Mobile */}
      <div className="flex lg:hidden gap-2.5 w-full mb-6 shrink-0">
        <div className="h-[3px] flex-1 bg-[#4A4A4A] rounded-full"></div>
        <div className="h-[3px] flex-1 bg-zinc-200 rounded-full"></div>
      </div>

      {/* Desktop Header area */}
      <div className="hidden lg:flex flex-col gap-4 mb-6 mx-auto w-full shrink-0 -mt-4">
        <div className="relative pl-6 select-none">
          <span className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-[#10B981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
          <h2 className="text-xl font-extrabold text-[#111111] tracking-tight leading-none">Create Assignment</h2>
          <p className="text-xs text-zinc-400 mt-2">Set up a new assignment for your students</p>
        </div>

        {/* Step-based Progress Bar */}
        <div className="flex gap-2.5 w-full mt-2 max-w-4xl mx-auto">
          <div className="h-[3px] flex-1 bg-[#4A4A4A] rounded-full"></div>
          <div className="h-[3px] flex-1 bg-zinc-200 rounded-full"></div>
        </div>
      </div>

      {/* Main card box */}
      <div className="bg-white/50 rounded-[32px] ld:p-0 p-5 border border-white lg:shadow-xs max-w-4xl mx-auto w-full mb-6 overflow-y-auto">
        <div className="mb-6 select-none pl-1 lg:pl-0">
          <h3 className="text-base lg:text-lg font-black text-zinc-950 tracking-tight">Assignment Details</h3>
          <p className="text-sm text-[#5E5E5E]/50 mt-0.5">Basic information about your assignment</p>
        </div>

        {/* File Drag and Drop */}
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center p-6 border-[3px] border-dashed border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50/10 rounded-3xl text-center cursor-pointer transition-all duration-200 mb-2.5 shadow-sm lg:shadow-none"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadedFile ? (
            <>
              <div className="p-3 bg-green-50 border border-green-200 rounded-full text-green-600 mb-3 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-zinc-900">{uploadedFile.name}</span>
              <span className="text-[11px] font-semibold text-zinc-400 mt-1">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                }}
                className="mt-3.5 px-4 py-2 bg-white border border-red-200 hover:border-red-400 text-red-500 rounded-full text-xs shadow-xs transition-colors cursor-pointer"
              >
                Remove File
              </button>
            </>
          ) : (
            <>
              <div className="p-3 bg-white border border-zinc-150 rounded-full shadow-xs text-zinc-550 group-hover:text-zinc-850 group-hover:border-zinc-350 transition-colors mb-3 mx-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm text-zinc-900">
                Choose a file or drag & drop it here
              </span>
              <span className="text-[11px] text-zinc-400 mt-1 mb-4">
                JPEG, PNG, upto 10MB
              </span>
              <button
                type="button"
                className="px-5 py-2 bg-[#F6F6F6] text-zinc-850 rounded-full font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Browse Files
              </button>
            </>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 text-center mb-6 select-none pl-1">
          Upload images of your preferred document/image
        </p>

        {/* Due Date Input */}
        <div className="flex flex-col gap-2 mb-6 pl-1 lg:pl-0 select-none">
          <label className="text-sm font-bold text-[#111111] tracking-tight">
            Due Date
          </label>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-3 bg-[#F6F6F6]/40 text-[#5E5E5E]/80 border border-zinc-200 focus:border-zinc-350 focus:bg-white rounded-full text-xs font-semibold outline-none transition-all text-left cursor-pointer",
                    !dueDate && "text-zinc-400"
                  )}
                >
                  {dueDate ? (
                    format(dueDate, "dd-MM-yyyy")
                  ) : (
                    <span>DD-MM-YYYY</span>
                  )}
                  <CalendarPlus className="w-5 h-5 text-zinc-800 stroke-[1.8]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-30" align="start">
                <ShadcnCalendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => {
                    // Disable past dates (keep active from today onwards)
                    const yesterday = new Date();
                    yesterday.setHours(0, 0, 0, 0);
                    return date < yesterday;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Question Type Configuration */}
        <div className="flex flex-col gap-2 pl-1 lg:pl-0">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#111111]">
              Question Type
            </label>
            <div className="hidden lg:flex items-center justify-around text-sm font-semibold text-[#111111]/80 select-none">
              <span className="w-28 text-center mr-6">No. of Questions</span>
              <span className="w-28 text-center">Marks</span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {questionTypes.map((item) => (
              <div key={item.id}>
                {/* ─── DESKTOP VIEW ─── */}
                <div className="hidden lg:flex items-center justify-between gap-2 py-0">
                  {/* Select + Delete */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between pl-5 pr-4 py-3 bg-white text-xs font-semibold text-zinc-800 border border-zinc-200 rounded-full outline-none focus:border-zinc-350 shadow-xs cursor-pointer text-left"
                          >
                            <span>{item.type}</span>
                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-1 z-30" align="start">
                          {QUESTION_TYPE_OPTIONS.map(opt => (
                            <DropdownMenuItem
                              key={opt}
                              onClick={() => {
                                setQuestionTypes(prev => prev.map(q => q.id === item.id ? { ...q, type: opt } : q));
                              }}
                              className="px-3 py-2.5 hover:bg-zinc-50 text-zinc-800 hover:text-zinc-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer outline-none"
                            >
                              {opt}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <button
                      onClick={() => removeQuestionType(item.id)}
                      className="p-2 hover:bg-zinc-100/60 rounded-full text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5 stroke-[1.8]" />
                    </button>
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-6 w-[280px] justify-end">
                    {/* Qs Counter */}
                    <div className="flex items-center bg-white border border-zinc-150 rounded-full px-2 py-1.5 shadow-xs shrink-0 w-28 justify-between">
                      <button
                        onClick={() => updateCount(item.id, -1)}
                        className="w-6 h-6 hover:bg-zinc-100 rounded-full text-zinc-350 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-2" color="#aaa" />
                      </button>
                      <span className="text-xs font-bold text-zinc-900">
                        {item.count}
                      </span>
                      <button
                        onClick={() => updateCount(item.id, 1)}
                        className="w-6 h-6 hover:bg-zinc-100 rounded-full text-zinc-350 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-2" color="#aaa" />
                      </button>
                    </div>

                    {/* Marks Counter */}
                    <div className="flex items-center bg-white border border-zinc-150 rounded-full px-2 py-1.5 shadow-xs shrink-0 w-28 justify-between">
                      <button
                        onClick={() => updateMarks(item.id, -1)}
                        className="w-6 h-6 hover:bg-zinc-100 rounded-full text-zinc-350 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-2" color="#aaa" />
                      </button>
                      <span className="text-xs font-bold text-zinc-900">
                        {item.marks}
                      </span>
                      <button
                        onClick={() => updateMarks(item.id, 1)}
                        className="w-6 h-6 hover:bg-zinc-100 rounded-full text-zinc-350 hover:text-zinc-800 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-2" color="#aaa" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── MOBILE VIEW ─── */}
                <div className="flex lg:hidden flex-col bg-white border border-zinc-200/40 rounded-[24px] p-4 shadow-sm mb-3.5 gap-4 relative">
                  {/* Select + Delete row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between pl-4 pr-3.5 py-3 bg-white text-xs font-semibold text-zinc-800 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-350 shadow-xs cursor-pointer text-left"
                          >
                            <span>{item.type}</span>
                            <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-1 z-30" align="start">
                          {QUESTION_TYPE_OPTIONS.map(opt => (
                            <DropdownMenuItem
                              key={opt}
                              onClick={() => {
                                setQuestionTypes(prev => prev.map(q => q.id === item.id ? { ...q, type: opt } : q));
                              }}
                              className="px-3 py-2.5 hover:bg-zinc-50 text-zinc-800 hover:text-zinc-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer outline-none"
                            >
                              {opt}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <button
                      onClick={() => removeQuestionType(item.id)}
                      className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-xl text-zinc-400 transition-colors cursor-pointer shrink-0"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Nested side-by-side grey counters */}
                  <div className="flex items-center gap-3 w-full">
                    {/* No of Qs pill */}
                    <div className="flex-1 flex flex-col items-center bg-[#F0F0F0] rounded-2xl py-2 px-3 gap-1">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mx-auto">No. of Questions</span>
                      <div className="flex items-center justify-between w-full mt-0.5">
                        <button
                          onClick={() => updateCount(item.id, -1)}
                          className="w-7 h-7 bg-white hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 shadow-xs active:scale-90 transition-all"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="text-sm font-black text-zinc-900">{item.count}</span>
                        <button
                          onClick={() => updateCount(item.id, 1)}
                          className="w-7 h-7 bg-[#F0F0F0] hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 shadow-xs active:scale-90 transition-all"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Marks pill */}
                    <div className="flex-1 flex flex-col items-center bg-[#F3F4F6]/75 rounded-2xl py-2 px-3 gap-1">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Marks</span>
                      <div className="flex items-center justify-between w-full mt-0.5">
                        <button
                          onClick={() => updateMarks(item.id, -1)}
                          className="w-7 h-7 bg-white hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 shadow-xs active:scale-90 transition-all"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="text-sm font-black text-zinc-900">{item.marks}</span>
                        <button
                          onClick={() => updateMarks(item.id, 1)}
                          className="w-7 h-7 bg-white hover:bg-zinc-50 rounded-full flex items-center justify-center text-zinc-700 shadow-xs active:scale-90 transition-all"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Type button */}
          <button
            onClick={addQuestionType}
            className="flex items-center gap-2.5 py-2 px-1 hover:bg-zinc-55/50 text-zinc-800 rounded-2xl font-bold text-xs transition-colors cursor-pointer w-fit mt-1.5"
          >
            <div className="w-6 h-6 bg-[#1C1C1C] text-white rounded-full flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Add Question Type</span>
          </button>

          {/* Total Display */}
          <div className="flex flex-col items-end gap-1 mt-6 pt-4 border-t border-zinc-150 md:text-sm font-semibold select-none pr-1">
            <span>Total Questions : <span className="text-zinc-900">{totalQuestions}</span></span>
            <span>Total Marks : <span className="text-zinc-900">{totalMarks}</span></span>
          </div>
        </div>

        {/* Additional Info Box */}
        <div className="flex flex-col gap-1 mt-6 pl-1 lg:pl-0">
          <label className="text-sm font-bold text-[#111111] tracking-tight">
            Additional Information (For better output)
          </label>
          <div className="relative border border-dashed border-zinc-300 hover:bg-white/40 bg-[#F6F6F6]/20 transition-all rounded-[24px] p-5">
            <textarea
              rows={2}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full bg-transparent text-zinc-850 text-xs font-semibold placeholder-zinc-400 outline-none resize-none pr-14"
            />
            <button
              type="button"
              className="absolute right-4 bottom-4 w-10 h-10 hover:bg-zinc-150 bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors active:scale-95"
            >
              <img
                src="/icons/mic.svg"
                alt="Voice input"
                className="w-4 h-4 select-none object-contain"
              />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-55 border border-red-200 rounded-xl text-xs font-bold text-red-650">
            {submitError}
          </div>
        )}
      </div>

      {/* Bottom Navigational Buttons */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pb-28 lg:pb-0 shrink-0 mt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 bg-white border border-zinc-250 hover:bg-zinc-50 text-zinc-800 rounded-full font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#1C1C1C] hover:bg-zinc-800 text-white rounded-full font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
