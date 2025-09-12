import { InferGetServerSidePropsType } from "next/types";
import { NotionService } from "services/notion";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  WorkoutSession,
  SessionExercise,
  WorkoutSessionState,
} from "../models/WorkoutSession";

export default function Workouts({
  items,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"OR" | "AND">("OR");
  const [isInitialized, setIsInitialized] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Session state
  const [sessionState, setSessionState] = useState<WorkoutSessionState>({
    currentSession: null,
    isPlaying: false,
    currentExerciseIndex: 0,
    timeRemaining: 30,
    intervalId: null,
  });
  const [sessionMode, setSessionMode] = useState(false); // true when in session mode
  const [defaultExerciseDuration, setDefaultExerciseDuration] = useState(30);

  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) {
      return items;
    }
    return items.filter((e) => {
      if (filterMode === "OR") {
        return selectedTags.some((tag) => e.tags.includes(tag));
      } else {
        return selectedTags.every((tag) => e.tags.includes(tag));
      }
    });
  }, [selectedTags, items, filterMode]);
  const selectedWorkout = filteredItems?.[selectedIndex];

  const uniqueTags = useMemo(() => {
    const allTagsFlatten = items.map((e) => e.tags).flat();
    return [...new Set(allTagsFlatten)];
  }, [items]);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return uniqueTags;
    return uniqueTags.filter(
      (tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTags.includes(tag)
    );
  }, [searchQuery, uniqueTags, selectedTags]);

  // Session serialization helpers
  const serializeSession = (session: WorkoutSession | null): string => {
    if (!session) return "";
    return btoa(
      JSON.stringify({
        id: session.id,
        name: session.name,
        exercises: session.exercises,
        autoplayInterval: session.autoplayInterval,
      })
    );
  };

  const deserializeSession = (sessionData: string): WorkoutSession | null => {
    try {
      if (!sessionData) return null;
      const data = JSON.parse(atob(sessionData));
      return {
        ...data,
        createdAt: new Date(),
        status: "created" as const,
        currentExerciseIndex: 0,
      };
    } catch {
      return null;
    }
  };

  // Load initial state from URL parameters
  useEffect(() => {
    if (router.isReady && !isInitialized) {
      const {
        tags,
        mode,
        session: sessionData,
        sessionMode: sessionModeParam,
      } = router.query;

      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        const validTags = tagsArray.flatMap((tag) =>
          typeof tag === "string"
            ? tag.split(",").filter((t) => uniqueTags.includes(t.trim()))
            : []
        );
        setSelectedTags(validTags);
      }

      if (mode && (mode === "OR" || mode === "AND")) {
        setFilterMode(mode as "OR" | "AND");
      }

      // Load session from URL
      if (sessionData && typeof sessionData === "string") {
        const loadedSession = deserializeSession(sessionData);
        if (loadedSession) {
          setSessionState((prev) => ({
            ...prev,
            currentSession: loadedSession,
            timeRemaining: loadedSession.autoplayInterval,
          }));
        }
      }

      // Load session mode from URL
      if (sessionModeParam === "true") {
        setSessionMode(true);
      }

      setIsInitialized(true);
    }
  }, [router.isReady, router.query, uniqueTags, isInitialized]);

  // Update URL when filters, session, or session mode change
  useEffect(() => {
    if (!isInitialized) return;

    const query: any = {};

    if (selectedTags.length > 0) {
      query.tags = selectedTags.join(",");
    }

    if (filterMode !== "OR") {
      query.mode = filterMode;
    }

    // Add session data to URL
    if (sessionState.currentSession) {
      query.session = serializeSession(sessionState.currentSession);
    }

    // Add session mode to URL
    if (sessionMode) {
      query.sessionMode = "true";
    }

    // Only update URL if there are changes
    const currentQuery = router.query;
    const hasChanges =
      query.tags !== currentQuery.tags ||
      query.mode !== currentQuery.mode ||
      query.session !== currentQuery.session ||
      query.sessionMode !== currentQuery.sessionMode;

    if (hasChanges) {
      router.push(
        {
          pathname: router.pathname,
          query: query,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [
    selectedTags,
    filterMode,
    sessionState.currentSession,
    sessionMode,
    isInitialized,
    router,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) => [...prev, tag]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setSearchQuery("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleFilterModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterMode(e.target.checked ? "AND" : "OR");
  };

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
  };

  const clearSession = () => {
    // Stop any running interval
    if (sessionState.intervalId) {
      clearInterval(sessionState.intervalId);
    }

    setSessionState({
      currentSession: null,
      isPlaying: false,
      currentExerciseIndex: 0,
      timeRemaining: defaultExerciseDuration,
      intervalId: null,
    });
    setSessionMode(false);
  };

  // Session management functions
  const createNewSession = () => {
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      name: `Sesión ${new Date().toLocaleDateString()}`,
      exercises: [],
      createdAt: new Date(),
      status: "created",
      currentExerciseIndex: 0,
      autoplayInterval: defaultExerciseDuration,
    };
    setSessionState((prev) => ({
      ...prev,
      currentSession: newSession,
      currentExerciseIndex: 0,
      timeRemaining: defaultExerciseDuration,
    }));
  };

  // Helper function to check if exercise is already in session
  const isExerciseInSession = (workout: any): boolean => {
    if (!sessionState.currentSession) return false;
    return sessionState.currentSession.exercises.some(
      (ex) =>
        ex.name === workout.name &&
        JSON.stringify(ex.videos) === JSON.stringify(workout.videos)
    );
  };

  const addExerciseToSession = (workout: any) => {
    if (!sessionState.currentSession) {
      createNewSession();
    }

    // Check if exercise already exists in session
    if (isExerciseInSession(workout)) {
      // Exercise already exists, don't add it
      return;
    }

    const exercise: SessionExercise = {
      id: Date.now().toString(),
      name: workout.name,
      tags: workout.tags,
      link: workout.link,
      videos: workout.videos,
      duration: defaultExerciseDuration,
    };

    setSessionState((prev) => ({
      ...prev,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            exercises: [...prev.currentSession.exercises, exercise],
          }
        : null,
    }));
  };

  const removeExerciseFromSession = (exerciseId: string) => {
    setSessionState((prev) => ({
      ...prev,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            exercises: prev.currentSession.exercises.filter(
              (ex) => ex.id !== exerciseId
            ),
          }
        : null,
    }));
  };

  const moveExerciseUp = (exerciseId: string) => {
    if (!sessionState.currentSession) return;

    const exercises = [...sessionState.currentSession.exercises];
    const currentIndex = exercises.findIndex((ex) => ex.id === exerciseId);

    if (currentIndex > 0) {
      // Swap with previous exercise
      [exercises[currentIndex - 1], exercises[currentIndex]] = [
        exercises[currentIndex],
        exercises[currentIndex - 1],
      ];

      // Update current exercise index if needed
      let newCurrentExerciseIndex = sessionState.currentExerciseIndex;
      if (sessionState.currentExerciseIndex === currentIndex) {
        newCurrentExerciseIndex = currentIndex - 1;
      } else if (sessionState.currentExerciseIndex === currentIndex - 1) {
        newCurrentExerciseIndex = currentIndex;
      }

      setSessionState((prev) => ({
        ...prev,
        currentExerciseIndex: newCurrentExerciseIndex,
        currentSession: prev.currentSession
          ? {
              ...prev.currentSession,
              exercises: exercises,
              currentExerciseIndex: newCurrentExerciseIndex,
            }
          : null,
      }));
    }
  };

  const moveExerciseDown = (exerciseId: string) => {
    if (!sessionState.currentSession) return;

    const exercises = [...sessionState.currentSession.exercises];
    const currentIndex = exercises.findIndex((ex) => ex.id === exerciseId);

    if (currentIndex < exercises.length - 1) {
      // Swap with next exercise
      [exercises[currentIndex], exercises[currentIndex + 1]] = [
        exercises[currentIndex + 1],
        exercises[currentIndex],
      ];

      // Update current exercise index if needed
      let newCurrentExerciseIndex = sessionState.currentExerciseIndex;
      if (sessionState.currentExerciseIndex === currentIndex) {
        newCurrentExerciseIndex = currentIndex + 1;
      } else if (sessionState.currentExerciseIndex === currentIndex + 1) {
        newCurrentExerciseIndex = currentIndex;
      }

      setSessionState((prev) => ({
        ...prev,
        currentExerciseIndex: newCurrentExerciseIndex,
        currentSession: prev.currentSession
          ? {
              ...prev.currentSession,
              exercises: exercises,
              currentExerciseIndex: newCurrentExerciseIndex,
            }
          : null,
      }));
    }
  };

  const goToExercise = (exerciseIndex: number) => {
    if (!sessionState.currentSession) return;

    const targetExercise = sessionState.currentSession.exercises[exerciseIndex];
    if (!targetExercise) return;

    const duration = targetExercise.duration || defaultExerciseDuration;

    setSessionState((prev) => ({
      ...prev,
      currentExerciseIndex: exerciseIndex,
      timeRemaining: duration,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            currentExerciseIndex: exerciseIndex,
          }
        : null,
    }));
  };

  const enterSessionMode = () => {
    setSessionMode(true);
  };

  const exitSessionMode = () => {
    setSessionMode(false);
    // Stop session if playing
    if (sessionState.isPlaying) {
      pauseSession();
    }
  };

  const startSession = () => {
    if (
      !sessionState.currentSession ||
      sessionState.currentSession.exercises.length === 0
    )
      return;

    const currentExercise =
      sessionState.currentSession.exercises[sessionState.currentExerciseIndex];
    const duration = currentExercise.duration || defaultExerciseDuration;

    setSessionState((prev) => ({
      ...prev,
      isPlaying: true,
      timeRemaining: duration,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            status: "playing",
          }
        : null,
    }));
  };

  const pauseSession = () => {
    if (sessionState.intervalId) {
      clearInterval(sessionState.intervalId);
    }
    setSessionState((prev) => ({
      ...prev,
      isPlaying: false,
      intervalId: null,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            status: "paused",
          }
        : null,
    }));
  };

  const stopSession = () => {
    if (sessionState.intervalId) {
      clearInterval(sessionState.intervalId);
    }
    setSessionState((prev) => ({
      ...prev,
      isPlaying: false,
      currentExerciseIndex: 0,
      intervalId: null,
      timeRemaining: defaultExerciseDuration,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            status: "created",
            currentExerciseIndex: 0,
          }
        : null,
    }));
  };

  const nextExercise = () => {
    if (!sessionState.currentSession) return;

    const nextIndex = sessionState.currentExerciseIndex + 1;
    if (nextIndex >= sessionState.currentSession.exercises.length) {
      // Session completed
      setSessionState((prev) => ({
        ...prev,
        isPlaying: false,
        currentSession: prev.currentSession
          ? {
              ...prev.currentSession,
              status: "completed",
            }
          : null,
      }));
      return;
    }

    const nextExercise = sessionState.currentSession.exercises[nextIndex];
    const duration = nextExercise.duration || defaultExerciseDuration;

    setSessionState((prev) => ({
      ...prev,
      currentExerciseIndex: nextIndex,
      timeRemaining: duration,
      currentSession: prev.currentSession
        ? {
            ...prev.currentSession,
            currentExerciseIndex: nextIndex,
          }
        : null,
    }));
  };

  // Timer effect for session autoplay
  useEffect(() => {
    if (sessionState.isPlaying && sessionState.timeRemaining > 0) {
      const intervalId = setInterval(() => {
        setSessionState((prev) => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            // Auto advance to next exercise
            setTimeout(nextExercise, 100);
            return prev;
          }
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);

      setSessionState((prev) => ({ ...prev, intervalId }));

      return () => clearInterval(intervalId);
    }
  }, [sessionState.isPlaying, sessionState.currentExerciseIndex]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (sessionState.intervalId) {
        clearInterval(sessionState.intervalId);
      }
    };
  }, [sessionState.intervalId]);

  // If in session mode, show full session interface
  if (sessionMode && sessionState.currentSession) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col p-4">
        {/* Session header with back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={exitSessionMode}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-xl text-white font-bold">Modo Sesión</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShareUrl}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm"
              title="Compartir sesión"
            >
              📋
            </button>
            <button
              onClick={clearSession}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
              title="Limpiar sesión"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Full session interface */}
        <div className="flex-1">
          <SessionView
            session={sessionState.currentSession}
            sessionState={sessionState}
            onStart={startSession}
            onPause={pauseSession}
            onStop={stopSession}
            onNext={nextExercise}
            onRemoveExercise={removeExerciseFromSession}
            onMoveExerciseUp={moveExerciseUp}
            onMoveExerciseDown={moveExerciseDown}
            onGoToExercise={goToExercise}
            defaultDuration={defaultExerciseDuration}
            onDurationChange={setDefaultExerciseDuration}
            fullScreen={true}
          />
        </div>
      </div>
    );
  }

  // Normal workout browsing mode
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col justify-between p-4">
      <h1 className="text-3xl text-white text-center">
        {selectedWorkout?.name}
      </h1>

      {selectedWorkout && (
        <>
          <WorkoutItem workout={selectedWorkout} />

          {/* Session control buttons - Optimized for mobile */}
          <div className="flex justify-center gap-1 mb-2 flex-wrap">
            {isExerciseInSession(selectedWorkout) ? (
              <button
                disabled
                className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs cursor-not-allowed flex items-center gap-1 opacity-70"
              >
                <span>✅</span>
                <span className="hidden sm:inline">Ya en sesión</span>
                <span className="sm:hidden">Añadido</span>
              </button>
            ) : (
              <button
                onClick={() => addExerciseToSession(selectedWorkout)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-500 transition-colors flex items-center gap-1"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Añadir a sesión</span>
                <span className="sm:hidden">Sesión</span>
              </button>
            )}

            {sessionState.currentSession &&
              sessionState.currentSession.exercises.length > 0 && (
                <>
                  <button
                    onClick={enterSessionMode}
                    className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-purple-500 transition-colors flex items-center gap-1"
                  >
                    <span>🎯</span>
                    <span className="hidden sm:inline">Empezar sesión</span>
                    <span className="sm:hidden">Empezar</span>
                    <span>
                      ({sessionState.currentSession.exercises.length})
                    </span>
                  </button>

                  <button
                    onClick={clearSession}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-red-500 transition-colors flex items-center gap-1"
                  >
                    <span>🗑️</span>
                    <span className="hidden sm:inline">Limpiar sesión</span>
                  </button>
                </>
              )}
          </div>
        </>
      )}

      {/* Filter section */}
      <div className="mb-2">
        <div className="flex flex-col items-center space-y-3 mb-4">
          {/* Search input with autocomplete */}
          <div className="relative w-full max-w-md" ref={dropdownRef}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Buscar tags..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Dropdown */}
            {isDropdownOpen && filteredTags.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <span className="text-gray-900">{tag}</span>
                    <span className="text-gray-500 ml-2">
                      ({items.filter((e) => e.tags.includes(tag)).length})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter mode toggle */}
          {selectedTags.length > 1 && (
            <div className="flex items-center space-x-2 text-white">
              <span className="text-sm">Modo filtro:</span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span
                  className={`text-sm ${
                    filterMode === "OR" ? "font-bold" : "opacity-70"
                  }`}
                >
                  OR
                </span>
                <input
                  type="checkbox"
                  checked={filterMode === "AND"}
                  onChange={handleFilterModeChange}
                  className="toggle-checkbox sr-only"
                />
                <div className="relative w-10 h-6 bg-gray-600 rounded-full transition-colors duration-200 ease-in-out">
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      filterMode === "AND" ? "transform translate-x-4" : ""
                    }`}
                  ></div>
                </div>
                <span
                  className={`text-sm ${
                    filterMode === "AND" ? "font-bold" : "opacity-70"
                  }`}
                >
                  AND
                </span>
              </label>
            </div>
          )}

          {/* Selected tags as chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="text-blue-200 hover:text-white focus:outline-none"
                    aria-label={`Remove ${tag} tag`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllTags}
                className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm hover:bg-gray-500"
              >
                Limpiar todo
              </button>
              <button
                onClick={handleShareUrl}
                className="bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-500"
              >
                📋 Compartir
              </button>
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="text-center text-white text-sm mb-2">
            Mostrando {filteredItems.length} workouts que{" "}
            {filterMode === "OR"
              ? "incluyen alguna de las"
              : "incluyen todas las"}{" "}
            tags: {selectedTags.join(", ")}
          </div>
        )}

        {/* Session info when not in session mode */}
        {sessionState.currentSession &&
          sessionState.currentSession.exercises.length > 0 && (
            <div className="text-center text-green-300 text-sm mb-2 bg-green-900/20 rounded-lg p-2">
              📝 Sesión creada: {sessionState.currentSession.exercises.length}{" "}
              ejercicios listos
            </div>
          )}
      </div>

      <div className="flex justify-between">
        {selectedIndex > 0 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex - 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 mr-auto"
          >
            Anterior
          </button>
        )}

        {selectedIndex < filteredItems.length - 1 && (
          <button
            onClick={() => setSelectedIndex(selectedIndex + 1)}
            className="bg-blue-600 text-lg text-white py-4 px-6 rounded-lg shadow hover:bg-blue-500 ml-auto"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}

interface WorkoutItemData {
  name: string;
  tags: string[];
  link: string;
  videos: string[];
}

const WorkoutItem = ({
  workout,
  layout,
}: {
  workout: WorkoutItemData;
  layout?: "vertical" | "horizontal";
}) => {
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 mb-6 relative">
        <video
          src={workout.videos[0]}
          autoPlay={true}
          muted
          loop
          className="max-w-full"
          style={{ width: layout === "horizontal" ? "50%" : "100%" }}
        />
        <video
          src={workout.videos[1]}
          autoPlay={true}
          muted
          loop
          className="max-w-full"
          style={{ width: layout === "horizontal" ? "50%" : "100%" }}
        />

        {/* Small workout link button */}
        {workout.link && (
          <a
            href={workout.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-blue-900 w-8 h-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
            title="Ver workout completo"
          >
            <span className="text-sm">↗</span>
          </a>
        )}
      </div>
    </>
  );
};

interface SessionViewProps {
  session: WorkoutSession;
  sessionState: WorkoutSessionState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onRemoveExercise: (id: string) => void;
  onMoveExerciseUp?: (id: string) => void;
  onMoveExerciseDown?: (id: string) => void;
  onGoToExercise?: (index: number) => void;
  defaultDuration: number;
  onDurationChange: (duration: number) => void;
  fullScreen?: boolean;
}

const SessionView = ({
  session,
  sessionState,
  onStart,
  onPause,
  onStop,
  onNext,
  onRemoveExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onGoToExercise,
  defaultDuration,
  onDurationChange,
  fullScreen = false,
}: SessionViewProps) => {
  const currentExercise = session.exercises[sessionState.currentExerciseIndex];
  const isPlaying = sessionState.isPlaying;
  const timeRemaining = sessionState.timeRemaining;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-lg text-white ${
        fullScreen ? "p-4 h-full flex flex-col" : "p-3"
      }`}
    >
      {/* Top section - different content based on mode */}
      <div className={`text-center ${fullScreen ? "mb-2" : "mb-3"}`}>
        {fullScreen ? (
          // Only exercise counter for fullScreen
          <div className="opacity-80 text-sm">
            {session.exercises.length} ejercicios •{" "}
            {sessionState.currentExerciseIndex + 1}/{session.exercises.length}
          </div>
        ) : (
          // Full header for compact mode
          <>
            <h2 className="text-lg font-bold mb-2">{session.name}</h2>
            <div className="opacity-80 text-xs">
              {session.exercises.length} ejercicios •{" "}
              {sessionState.currentExerciseIndex + 1}/{session.exercises.length}
            </div>
          </>
        )}
      </div>

      {/* Current Exercise Display - Reorganized for fullScreen */}
      {fullScreen ? (
        // Full screen mode - videos at top, large and prominent
        <div className="flex-1 flex flex-col">
          {currentExercise && (
            <>
              {/* Large videos at the top */}
              <div className="mb-4 -mx-1">
                {currentExercise.videos.slice(0, 2).map((video, idx) => (
                  <video
                    key={idx}
                    src={video}
                    autoPlay
                    muted
                    loop
                    // style={{ height: "40vh", width: "100vw" }}
                  />
                ))}
              </div>

              {/* Exercise info and timer */}
              <div className="bg-white/10 rounded-lg p-4 text-center mb-4">
                <h3 className="text-xl font-semibold mb-3">
                  {currentExercise.name}
                </h3>

                {session.status === "playing" && (
                  <>
                    <div className="text-5xl font-bold mb-3">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (((currentExercise.duration || defaultDuration) -
                              timeRemaining) /
                              (currentExercise.duration || defaultDuration)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        // Compact mode - original layout
        currentExercise &&
        session.status === "playing" && (
          <div className="mb-3 bg-white/10 rounded-lg p-3 text-center">
            <h3 className="text-base font-semibold mb-1">
              {currentExercise.name}
            </h3>
            <div className="text-2xl font-bold mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    (((currentExercise.duration || defaultDuration) -
                      timeRemaining) /
                      (currentExercise.duration || defaultDuration)) *
                    100
                  }%`,
                }}
              ></div>
            </div>

            {/* Mini video display */}
            <div className="flex gap-1 justify-center">
              {currentExercise.videos.slice(0, 2).map((video, idx) => (
                <video
                  key={idx}
                  src={video}
                  autoPlay
                  muted
                  loop
                  className="w-16 h-12 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )
      )}

      {/* Session Controls */}
      <div
        className={`flex justify-center gap-3 ${fullScreen ? "mb-4" : "mb-3"}`}
      >
        {!isPlaying ? (
          <button
            onClick={onStart}
            disabled={session.exercises.length === 0}
            className={`bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors ${
              fullScreen ? "px-6 py-3 text-lg" : "px-3 py-1.5 text-sm"
            }`}
          >
            ▶️{" "}
            {fullScreen ? (
              "Iniciar"
            ) : (
              <span className="hidden sm:inline">Iniciar</span>
            )}
          </button>
        ) : (
          <button
            onClick={onPause}
            className={`bg-yellow-600 hover:bg-yellow-500 text-white rounded-md font-semibold transition-colors ${
              fullScreen ? "px-6 py-3 text-lg" : "px-3 py-1.5 text-sm"
            }`}
          >
            ⏸️{" "}
            {fullScreen ? (
              "Pausar"
            ) : (
              <span className="hidden sm:inline">Pausar</span>
            )}
          </button>
        )}

        <button
          onClick={onStop}
          disabled={session.status === "created"}
          className={`bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors ${
            fullScreen ? "px-6 py-3 text-lg" : "px-3 py-1.5 text-sm"
          }`}
        >
          ⏹️{" "}
          {fullScreen ? (
            "Parar"
          ) : (
            <span className="hidden sm:inline">Parar</span>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={
            sessionState.currentExerciseIndex >= session.exercises.length - 1
          }
          className={`bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors ${
            fullScreen ? "px-6 py-3 text-lg" : "px-3 py-1.5 text-sm"
          }`}
        >
          ⏭️{" "}
          {fullScreen ? (
            "Siguiente"
          ) : (
            <span className="hidden sm:inline">Siguiente</span>
          )}
        </button>
      </div>

      {/* Session title moved to bottom in fullScreen mode */}
      {fullScreen && (
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-white/80">{session.name}</h2>
        </div>
      )}

      {/* Duration Setting */}
      <div
        className={`flex items-center justify-center gap-2 mb-4 ${
          fullScreen ? "text-base" : "text-xs mb-3"
        }`}
      >
        <label className={fullScreen ? "text-base" : "text-xs"}>
          Duración:
        </label>
        <select
          value={defaultDuration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className={`bg-white/20 rounded px-2 py-1 text-white ${
            fullScreen ? "text-base" : "text-xs"
          }`}
        >
          <option value={15}>15s</option>
          <option value={30}>30s</option>
          <option value={45}>45s</option>
          <option value={60}>60s</option>
          <option value={90}>90s</option>
        </select>
      </div>

      {/* Exercise List */}
      <div
        className={`space-y-1 overflow-y-auto ${
          fullScreen ? "max-h-96" : "max-h-48"
        }`}
      >
        <h3
          className={`font-semibold text-center ${
            fullScreen ? "text-lg mb-3" : "text-sm"
          }`}
        >
          Ejercicios ({session.exercises.length}):
        </h3>
        {session.exercises.length === 0 ? (
          <p
            className={`text-center opacity-70 py-2 ${
              fullScreen ? "text-base" : "text-xs"
            }`}
          >
            No hay ejercicios en la sesión
          </p>
        ) : (
          session.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className={`flex items-center gap-3 p-3 rounded ${
                fullScreen ? "text-base" : "text-sm"
              } ${
                index === sessionState.currentExerciseIndex && isPlaying
                  ? "bg-green-600/30 border border-green-400"
                  : "bg-white/10"
              }`}
            >
              {/* Reorder controls - moved to left */}
              {onMoveExerciseUp && onMoveExerciseDown && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => onMoveExerciseUp(exercise.id)}
                    disabled={index === 0}
                    className={`text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${
                      fullScreen ? "text-lg" : "text-base"
                    }`}
                    title="Mover arriba"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => onMoveExerciseDown(exercise.id)}
                    disabled={index === session.exercises.length - 1}
                    className={`text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors ${
                      fullScreen ? "text-lg" : "text-base"
                    }`}
                    title="Mover abajo"
                  >
                    ⬇️
                  </button>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`font-medium truncate flex-1 ${
                      onGoToExercise
                        ? "cursor-pointer hover:text-blue-300 transition-colors"
                        : ""
                    }`}
                    onClick={() => onGoToExercise && onGoToExercise(index)}
                    title={onGoToExercise ? "Ir a este ejercicio" : undefined}
                  >
                    {index + 1}. {exercise.name}
                  </div>
                  {index === sessionState.currentExerciseIndex && (
                    <span className="text-green-400 flex-shrink-0">⚡</span>
                  )}
                </div>
                <div
                  className={`opacity-70 truncate ${
                    fullScreen ? "text-sm" : "text-xs"
                  }`}
                >
                  {exercise.tags.slice(0, 2).join(", ")}
                  {exercise.tags.length > 2 ? "..." : ""} •{" "}
                  {exercise.duration || defaultDuration}s
                </div>
              </div>

              {/* Delete button - moved to right alone */}
              <button
                onClick={() => onRemoveExercise(exercise.id)}
                className={`text-red-400 hover:text-red-300 flex-shrink-0 ${
                  fullScreen ? "text-lg" : "text-base"
                }`}
                title="Eliminar ejercicio"
              >
                ❌
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export async function getServerSideProps() {
  const notion = new NotionService();
  const data = await notion.getWorkouts();
  return {
    props: {
      items: data,
    },
  };
}
