"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type SocketStatus = "idle" | "connecting" | "processing" | "done" | "failed";

interface UseSocketReturn {
  status: SocketStatus;
  error: string | null;
  /** Manually reset to idle */
  reset: () => void;
}

/**
 * Custom hook that connects to the backend Socket.io server,
 * joins a room keyed by `assignmentId`, and listens for
 * `job:update` events to track generation progress.
 */
export function useSocket(assignmentId: string | null): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    setStatus("connecting");
    setError(null);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", assignmentId);
    });

    socket.on("joined", () => {
      // Successfully joined room — now waiting for updates
      setStatus("processing");
    });

    socket.on(
      "job:update",
      (data: { status: string; error?: string; paperId?: string }) => {
        if (data.status === "processing") {
          setStatus("processing");
        } else if (data.status === "done") {
          setStatus("done");
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.error ?? "Generation failed");
        }
      }
    );

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      // Don't mark as failed — polling fallback will handle it
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [assignmentId]);

  return { status, error, reset };
}
