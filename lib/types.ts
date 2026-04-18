export type Puzzle = {
  id: string;
  answer: string;
  length: number;
  variables: Record<string, number>;
  allowedTokens: string[];
  maxAttempts: number;
  difficulty: string;
};

export type FeedbackColor = "correct" | "present" | "absent";

export type ResultRecord = {
  puzzleId: string;
  sessionId: string;
  attemptsCount: number;
  cleared: boolean;
  clearTimeMs: number;
  createdAt: string;
};
