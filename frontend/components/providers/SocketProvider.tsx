"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useJobStore } from "@/store/useJobStore";
import { useAssignmentStore } from "@/store/assignmentStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { addJob, updateJobStatus } = useJobStore();
  const activeJobs = useJobStore((state) => state.activeJobs);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socket = io(apiUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const joinProcessingRooms = () => {
      const currentJobs = useJobStore.getState().activeJobs;
      currentJobs.forEach((job) => {
        if (job.status === "processing") {
          socket.emit("join", job.assignmentId);
        }
      });
    };

    socket.on("connect", () => {
      joinProcessingRooms();
    });

    socket.on(
      "job:update",
      (data: {
        assignmentId: string;
        status: "processing" | "done" | "failed";
        title?: string;
        error?: string;
      }) => {
        const { assignmentId, status } = data;

        if (!assignmentId) return;

        // Resolve title: Check active jobs, then the cached assignments list, else fallback
        const existingJob = useJobStore.getState().activeJobs.find((j) => j.assignmentId === assignmentId);
        const existingAssignment = useAssignmentStore.getState().assignments.find((a) => a._id === assignmentId);
        const title = data.title || existingJob?.title || existingAssignment?.title || "AI Assignment";

        // Ensure the job exists in the store first, then update status
        addJob({ assignmentId, title, status });
        updateJobStatus(assignmentId, status);

        // Refresh the global assignment list store so the dashboard updates in real-time
        try {
          useAssignmentStore.getState().fetchAssignments();
        } catch (err) {
          console.error("[SocketProvider] Failed to refresh assignments store:", err);
        }

        if (status === "done") {
          toast.success(`Assignment "${title}" ready!`, {
            description: "Your background generation job has completed successfully.",
            action: {
              label: "View",
              onClick: () => {
                const store = useAssignmentStore.getState();
                store.setCurrentAssignmentId(assignmentId);
                store.setViewState("preview");
              },
            },
            duration: 10000,
          });
        } else if (status === "failed") {
          toast.error(`Failed to generate "${title}"`, {
            description: data.error || "An error occurred during the assignment generation process.",
            duration: 10000,
          });
        }
      }
    );

    socket.on("disconnect", () => {
      // Disconnected from WebSocket server
    });

    return () => {
      socket.disconnect();
    };
  }, [addJob, updateJobStatus, router]);

  // Keep socket joined to all active rooms as activeJobs array updates in the store
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    activeJobs.forEach((job) => {
      if (job.status === "processing") {
        socket.emit("join", job.assignmentId);
      }
    });
  }, [activeJobs]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
