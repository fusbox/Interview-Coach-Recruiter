// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useContext } from 'react';
import { SessionContext, SessionProvider } from './SessionContext';
import { InterviewSession } from '@/lib/domain/types';
import { secureStorage } from '../utils/encryption';

// Mock dependencies
vi.mock('../services/geminiService', () => ({
  generateQuestions: vi.fn(),
  generateQuestionTips: vi.fn(),
  generateBlueprint: vi.fn(),
  generateSpeech: vi.fn().mockResolvedValue('blob:url'),
  initSession: vi.fn(),
}));

vi.mock('../services/sessionService', () => ({
  sessionService: {
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
  },
}));

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

// Mock Secure Storage
vi.mock('../utils/encryption', () => ({
  secureStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

// Test Component to consume Context
const TestConsumer = () => {
  const context = useContext(SessionContext);
  if (!context) return <div>No Context</div>;

  // Type narrowing for question text
  let questionText = 'N/A';
  if (context.session && context.now.currentQuestionId) {
    const q = context.session.questions.find(q => q.id === context.now.currentQuestionId);
    if (q) questionText = q.text;
  }

  return (
    <div>
      <div data-testid="status">{context.now.status}</div>
      <div data-testid="screen">{context.screen}</div>
      <div data-testid="question-text">{questionText}</div>
    </div>
  );
};

describe('SessionContext Headless Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should derive ACTIVE state and QUESTION_SCREEN correctly from legacy session', async () => {
    // 1. Setup Legacy State
    const legacySession: InterviewSession = {
      id: 'test-session',
      role: 'Dev',
      status: 'ACTIVE',
      currentQuestionIndex: 0,
      questions: [
        {
          id: 'q1',
          text: 'What is React?',
          type: 'Technical',
          competencyId: 'c1',
          difficulty: 'Medium',
        },
      ],
      answers: {},
    };

    // 2. Mock Storage
    vi.mocked(secureStorage.getItem).mockReturnValue(legacySession);

    // 3. Render Provider
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    // 4. Assert Headless State
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(/ACTIVE/i);
    });

    expect(screen.getByTestId('screen')).toHaveTextContent(/QUESTION/i);
    expect(screen.getByTestId('question-text')).toHaveTextContent('What is React?');
  });

  it('should derive REVIEW state and EVALUATION_SCREEN when answers exist', async () => {
    // 1. Setup Legacy State in Review
    const legacySession: InterviewSession = {
      id: 'test-session',
      role: 'Dev',
      status: 'ACTIVE',
      currentQuestionIndex: 0,
      questions: [
        {
          id: 'q1',
          text: 'What is React?',
          type: 'Technical',
          competencyId: 'c1',
          difficulty: 'Medium',
        },
      ],
      answers: {
        q1: {
          text: 'React is a library.',
          analysis: {
            answerScore: 85,
            feedback: ['Good job'], // string[]
            keyTerms: [],
            missingElements: [],
            transcript: 'React is a library.',
            rating: 'Good',
          },
        },
      },
    };

    // 2. Mock Storage
    vi.mocked(secureStorage.getItem).mockReturnValue(legacySession);

    // 3. Render
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    // 4. Assert
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(/REVIEWING/i);
    });

    // Expect REVIEW_FEEDBACK screen to be active during REVIEWING status
    expect(screen.getByTestId('screen')).toHaveTextContent(/REVIEW_FEEDBACK/i);
  });
});
