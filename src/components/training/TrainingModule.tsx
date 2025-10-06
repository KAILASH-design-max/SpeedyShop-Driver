
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BookOpen, Video, Shield, Package, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const trainingModules = [
  {
    title: "App Navigation",
    icon: Video,
    description: "Learn how to navigate the Velocity Driver app, accept orders, and manage your status.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder video
    content: [
      "Accepting and rejecting new orders from the dashboard.",
      "Using the availability toggle to go online or offline.",
      "Navigating to the order details page.",
      "Finding your earnings and performance metrics.",
    ],
  },
  {
    title: "Safety Protocols",
    icon: Shield,
    description: "Your safety is our priority. Learn about our safety guidelines and emergency features.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    content: [
      "Using the in-app Emergency SOS button.",
      "Best practices for road safety and vehicle maintenance.",
      "How to handle difficult customer interactions.",
      "Reporting incidents through the app.",
    ],
  },
  {
    title: "Delivery Best Practices",
    icon: Package,
    description: "Provide a 5-star experience with these delivery tips and tricks.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    content: [
      "Handling packages with care to avoid damage.",
      "Communicating effectively with customers.",
      "Confirming delivery with photo proof for no-contact orders.",
      "Understanding the ratings and feedback system.",
    ],
  },
];

const quizQuestions = [
  {
    question: "What should you do if your vehicle breaks down during a delivery?",
    options: [
      "Abandon the order and go home.",
      "Call the customer and ask them to pick it up.",
      "Move to a safe location and contact support immediately.",
      "Try to fix the vehicle yourself first.",
    ],
    correctAnswer: "Move to a safe location and contact support immediately.",
  },
  {
    question: "How do you confirm a no-contact delivery?",
    options: [
      "Leave the package and mark it as delivered without proof.",
      "Take a clear photo of the package at the customer's doorstep.",
      "Get a signature from a neighbor.",
      "Wait for the customer to come out.",
    ],
    correctAnswer: "Take a clear photo of the package at the customer's doorstep.",
  },
  {
    question: "Where can you find your weekly earnings summary?",
    options: [
        "In the Support tab.",
        "In the Earnings tab.",
        "The app does not show earnings.",
        "In your email."
    ],
    correctAnswer: "In the Earnings tab."
  }
];

export function TrainingModule() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
    setShowResults(false);
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(answers).length !== quizQuestions.length) {
      toast({
        variant: "destructive",
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
      });
      return;
    }
    setShowResults(true);
    toast({
        title: "Quiz Submitted!",
        description: "Check your results below.",
        className: "bg-green-500 text-white"
    });
  };

  const score = quizQuestions.reduce((acc, question, index) => {
    return acc + (answers[index] === question.correctAnswer ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-primary">
            <BookOpen className="mr-3 h-7 w-7" />
            Training & Onboarding Center
          </CardTitle>
          <CardDescription>
            Welcome! Complete these modules to get ready for your first delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {trainingModules.map((module, index) => (
              <Card key={index} className="overflow-hidden shadow-sm">
                <AccordionItem value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="p-4 hover:no-underline bg-muted/50 data-[state=open]:bg-secondary">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-background rounded-full">
                        <module.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground">{module.title}</p>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div>
                            <p className="font-semibold mb-3 text-base">Key Topics:</p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            {module.content.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                            </ul>
                        </div>
                        <div className="aspect-video">
                            <iframe
                            className="w-full h-full rounded-lg shadow-md"
                            src={module.videoUrl}
                            title="Training Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Onboarding Quiz</CardTitle>
          <CardDescription>
            Answer these questions to confirm you've understood the training material.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quizQuestions.map((q, index) => (
            <div key={index} className="p-4 border rounded-lg bg-muted/20">
              <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
              <RadioGroup
                onValueChange={(value) => handleAnswerChange(index, value)}
                value={answers[index]}
                className="space-y-2"
              >
                {q.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`q${index}-option${i}`} />
                    <Label htmlFor={`q${index}-option${i}`} className="font-normal cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              {showResults && (
                <div className="mt-4 p-3 rounded-md text-sm" style={{
                    backgroundColor: answers[index] === q.correctAnswer ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
                    color: answers[index] === q.correctAnswer ? 'hsl(var(--accent-foreground))' : 'hsl(var(--destructive-foreground))'
                }}>
                  {answers[index] === q.correctAnswer ? (
                     <p className="flex items-center"><CheckCircle className="mr-2 h-4 w-4"/> Correct!</p>
                  ) : (
                     <p className="flex items-center"><XCircle className="mr-2 h-4 w-4"/> Incorrect. The right answer is: "{q.correctAnswer}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
           {showResults && (
              <Alert variant={score === quizQuestions.length ? "default" : "destructive"} className={score === quizQuestions.length ? "bg-green-50 border-green-200 text-green-800" : ""}>
                <AlertTitle className="font-bold">Quiz Result</AlertTitle>
                <AlertDescription>
                  You scored {score} out of {quizQuestions.length}.
                  {score < quizQuestions.length ? " Please review the material and retake the quiz." : " Great job! You have passed the quiz."}
                </AlertDescription>
              </Alert>
           )}
          <Button onClick={handleSubmitQuiz} className="w-full text-base py-6">
            Submit Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
