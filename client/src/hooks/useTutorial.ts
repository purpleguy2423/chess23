import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TutorialLesson, TutorialStep } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Chess } from 'chess.js';

export function useTutorial() {
  const [lessons, setLessons] = useState<TutorialLesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<TutorialLesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Fetch all tutorial lessons
  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tutorials');
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      
      const lessonsData = await response.json();
      setLessons(lessonsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load tutorial lessons.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch a specific lesson
  const fetchLesson = useCallback(async (lessonId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tutorials/${lessonId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }
      
      const lessonData = await response.json();
      setCurrentLesson(lessonData);
      setCurrentStepIndex(0);
      
      // Load the initial board state from the first step
      if (lessonData.steps && lessonData.steps.length > 0) {
        const newChess = new Chess();
        newChess.load(lessonData.steps[0].boardState);
        setChess(newChess);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast({
        title: "Error",
        description: "Failed to load the tutorial lesson.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [toast]);

  // Mark a lesson as completed
  const completeLesson = useCallback(async (lessonId: string) => {
    try {
      // In a real app, this would send a request to the server to update the user's progress
      // For now, we'll just track it locally
      setCompletedLessons(prev => {
        if (prev.includes(lessonId)) return prev;
        return [...prev, lessonId];
      });
      
      toast({
        title: "Lesson Completed",
        description: "Congratulations on completing this lesson!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  }, [toast]);

  // Move to the next step in the current lesson
  const nextStep = useCallback(() => {
    if (!currentLesson || currentStepIndex >= currentLesson.steps.length - 1) {
      // Lesson is complete
      if (currentLesson) {
        completeLesson(currentLesson.id);
      }
      return;
    }
    
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    
    // Load the board state for the next step
    const nextStep = currentLesson.steps[nextIndex];
    const newChess = new Chess();
    newChess.load(nextStep.boardState);
    setChess(newChess);
    
    toast({
      title: nextStep.title,
      description: "Moving to the next step.",
      variant: "default",
    });
  }, [completeLesson, currentLesson, currentStepIndex, toast]);

  // Move to the previous step in the current lesson
  const previousStep = useCallback(() => {
    if (!currentLesson || currentStepIndex <= 0) {
      return;
    }
    
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    
    // Load the board state for the previous step
    const prevStep = currentLesson.steps[prevIndex];
    const newChess = new Chess();
    newChess.load(prevStep.boardState);
    setChess(newChess);
  }, [currentLesson, currentStepIndex]);

  // Get the current step
  const getCurrentStep = useCallback((): TutorialStep | null => {
    if (!currentLesson || !currentLesson.steps || currentLesson.steps.length === 0) {
      return null;
    }
    
    return currentLesson.steps[currentStepIndex];
  }, [currentLesson, currentStepIndex]);

  // Check if a move completes the current tutorial step
  const checkStepCompletion = useCallback((from: string, to: string): boolean => {
    const currentStep = getCurrentStep();
    if (!currentStep || !currentStep.expectedMove) {
      return false;
    }
    
    // Check if this move matches the expected move
    return (
      currentStep.expectedMove.from === from && 
      currentStep.expectedMove.to === to
    );
  }, [getCurrentStep]);

  // Make a move in the tutorial
  const makeMove = useCallback((from: string, to: string): boolean => {
    try {
      const move = chess.move({ from, to });
      
      if (move) {
        // Check if this move completes the current step
        if (checkStepCompletion(from, to)) {
          toast({
            title: "Correct Move!",
            description: "That's the right move. Great job!",
            variant: "default",
          });
          
          // Proceed to next step
          nextStep();
        } else {
          toast({
            title: "Try Again",
            description: "That's not the move we're looking for in this lesson.",
            variant: "destructive",
          });
          
          // Undo the move
          chess.undo();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [chess, checkStepCompletion, nextStep, toast]);

  // Reset the current step
  const resetStep = useCallback(() => {
    const currentStep = getCurrentStep();
    if (!currentStep) return;
    
    const newChess = new Chess();
    newChess.load(currentStep.boardState);
    setChess(newChess);
  }, [getCurrentStep]);

  // Initialize lessons on first load
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    currentLesson,
    currentStepIndex,
    isLoading,
    chess,
    completedLessons,
    
    fetchLessons,
    fetchLesson,
    completeLesson,
    nextStep,
    previousStep,
    getCurrentStep,
    makeMove,
    resetStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentLesson ? currentStepIndex === currentLesson.steps.length - 1 : false
  };
}
