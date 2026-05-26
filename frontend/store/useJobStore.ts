import { create } from "zustand";

export interface ActiveJob {
  assignmentId: string;
  title: string;
  status: "processing" | "done" | "failed";
}

interface JobState {
  activeJobs: ActiveJob[];
  addJob: (job: ActiveJob) => void;
  updateJobStatus: (assignmentId: string, status: "processing" | "done" | "failed") => void;
  removeJob: (assignmentId: string) => void;
}

export const useJobStore = create<JobState>((set) => ({
  activeJobs: [],
  addJob: (job) =>
    set((state) => {
      const exists = state.activeJobs.some((j) => j.assignmentId === job.assignmentId);
      if (exists) {
        return {
          activeJobs: state.activeJobs.map((j) =>
            j.assignmentId === job.assignmentId ? { ...j, ...job } : j
          ),
        };
      }
      return { activeJobs: [...state.activeJobs, job] };
    }),
  updateJobStatus: (assignmentId, status) =>
    set((state) => ({
      activeJobs: state.activeJobs.map((j) =>
        j.assignmentId === assignmentId ? { ...j, status } : j
      ),
    })),
  removeJob: (assignmentId) =>
    set((state) => ({
      activeJobs: state.activeJobs.filter((j) => j.assignmentId !== assignmentId),
    })),
}));
