import { create } from "zustand";
import { listAssignments, deleteAssignment as apiDeleteAssignment } from "@/lib/api";
import type { Assignment } from "@/types/exam";

type ViewState = "list" | "create" | "preview";

interface AssignmentState {
  viewState: ViewState;
  currentAssignmentId: string | null;
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setViewState: (view: ViewState) => void;
  setCurrentAssignmentId: (id: string | null) => void;
  fetchAssignments: () => Promise<void>;
  addAssignment: (assignment: Assignment) => void;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  reset: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  viewState: "list",
  currentAssignmentId: null,
  assignments: [],
  isLoading: false,
  error: null,

  setViewState: (view) => set({ viewState: view }),

  setCurrentAssignmentId: (id) => set({ currentAssignmentId: id }),

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await listAssignments();
      set({ assignments: data, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load assignments";
      set({ error: msg, isLoading: false });
    }
  },

  addAssignment: (newAssignment) => {
    set((state) => ({
      assignments: [newAssignment, ...state.assignments]
    }));
  },

  deleteAssignment: async (assignmentId) => {
    try {
      await apiDeleteAssignment(assignmentId);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== assignmentId)
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete assignment";
      set({ error: msg });
      throw err;
    }
  },

  reset: () => set({ viewState: "list", currentAssignmentId: null, error: null })
}));
