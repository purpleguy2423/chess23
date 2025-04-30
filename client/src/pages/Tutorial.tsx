import { useState, useEffect } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import GameModeTabs from "@/components/GameModeTabs";
import ChessBoard from "@/components/ChessBoard";
import TutorialOverlay from "@/components/TutorialOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronRight, BookOpen } from "lucide-react";
import { TutorialLesson } from "@shared/schema";

const Tutorial = () => {
  const {
    lessons,
    currentLesson,
    isLoading,
    fetchLesson,
    getCurrentStep,
    nextStep,
    previousStep,
    makeMove,
    resetStep,
    completedLessons,
    isFirstStep,
    isLastStep
  } = useTutorial();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [tutorialStarted, setTutorialStarted] = useState(false);

  // Handle lesson selection
  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    fetchLesson(lessonId);
    setTutorialStarted(true);
  };

  // Handle tutorial step completion
  const handleCompleteStep = () => {
    nextStep();
  };

  // Handle move during tutorial
  const handleTutorialMove = (from: string, to: string) => {
    makeMove(from, to);
  };

  // Handle back to lesson selection
  const handleBackToLessons = () => {
    setTutorialStarted(false);
    setSelectedLessonId(null);
  };

  // Get highlighted square from current step
  const getHighlightedSquare = () => {
    const currentStep = getCurrentStep();
    if (!currentStep || !currentStep.highlightSquares || currentStep.highlightSquares.length === 0) {
      return undefined;
    }
    return currentStep.highlightSquares[0];
  };

  return (
    <main className="container mx-auto p-4">
      <GameModeTabs activeTab="tutorial" />

      {!tutorialStarted ? (
        <div className="py-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Chess Tutorials</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Learn chess from scratch or improve your skills with our interactive tutorials.
              Step-by-step guidance with hands-on practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <Card className="col-span-full h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading tutorials...</p>
                </div>
              </Card>
            ) : (
              lessons.map((lesson) => (
                <Card key={lesson.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{lesson.title}</CardTitle>
                      {completedLessons.includes(lesson.id) && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {lesson.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-500">
                      {lesson.steps.length} steps · Beginner friendly
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={() => handleSelectLesson(lesson.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {completedLessons.includes(lesson.id) ? "Review Lesson" : "Start Lesson"}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="main-container flex flex-col lg:flex-row gap-6 relative">
          <ChessBoard 
            playerName="You"
            opponentName="Tutorial"
            tutorialHighlightSquare={getHighlightedSquare()}
            onCompleteTutorialStep={handleCompleteStep}
          />
          
          <div className="lg:w-1/3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{currentLesson?.title}</CardTitle>
                <CardDescription>
                  {currentLesson?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Current step:</h3>
                    <p className="text-lg font-semibold">{getCurrentStep()?.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Instructions:</h3>
                    <p>{getCurrentStep()?.description}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBackToLessons}>
                  Back to Lessons
                </Button>
                <Button variant="outline" onClick={resetStep}>
                  Reset Step
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {getCurrentStep() && (
            <TutorialOverlay
              step={getCurrentStep()!}
              onClose={() => {}}
              onNext={nextStep}
              onBack={previousStep}
              onSkip={handleBackToLessons}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
            />
          )}
        </div>
      )}
    </main>
  );
};

export default Tutorial;
