"use client";

import { SessionProvider } from "@/context/SessionContext"
import SessionOrchestrator from "@/components/session/SessionOrchestrator"

interface InterviewSessionScreenProps {
  sessionId?: string;
  initialConfig?: {
    role: string;
    jobDescription?: string;
  }
}

export default function InterviewSessionScreen({ sessionId, initialConfig }: InterviewSessionScreenProps) {
  // SessionProvider is now handled at the Layout level (CandidateLayoutClient)
  return (
    <SessionOrchestrator />
  )
}
