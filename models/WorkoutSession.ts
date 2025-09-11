export interface WorkoutSession {
  id: string;
  name: string;
  exercises: SessionExercise[];
  createdAt: Date;
  duration?: number; // in seconds
  status: "created" | "playing" | "paused" | "completed";
  currentExerciseIndex: number;
  autoplayInterval: number; // seconds per exercise
}

export interface SessionExercise {
  id: string;
  name: string;
  tags: string[];
  link: string;
  videos: string[];
  repetitions?: string;
  duration?: number; // custom duration for this exercise in session
}

export interface WorkoutSessionState {
  currentSession: WorkoutSession | null;
  isPlaying: boolean;
  currentExerciseIndex: number;
  timeRemaining: number;
  intervalId: NodeJS.Timeout | null;
}
