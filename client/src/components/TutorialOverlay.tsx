import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { TutorialStep } from "@shared/schema";

type TutorialOverlayProps = {
  step: TutorialStep;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
};

const TutorialOverlay = ({
  step,
  onClose,
  onNext,
  onBack,
  onSkip,
  isFirstStep,
  isLastStep
}: TutorialOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <Card className="max-w-md w-full">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mb-4">
            <p className="mb-2">{step.description}</p>
            {step.highlightSquares && step.highlightSquares.length > 0 && (
              <p className="text-sm text-gray-600">
                Highlighted square: <strong>{step.highlightSquares[0].toUpperCase()}</strong>
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center px-5 pb-5 pt-0">
          <Button 
            variant="link" 
            className="text-primary hover:underline"
            onClick={onSkip}
          >
            Skip Tutorial
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isFirstStep}
              className="border border-gray-300 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              onClick={onNext}
              className="bg-accent text-white hover:bg-accent/90"
            >
              {isLastStep ? "Finish" : "Got it"} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TutorialOverlay;
