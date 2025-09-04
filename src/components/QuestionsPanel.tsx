import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send, User, UserX, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question: string;
  asker_name: string | null;
  is_answered: boolean;
  created_at: string;
}

interface QuestionsPanelProps {
  meetingId: string;
}

export const QuestionsPanel = ({ meetingId }: QuestionsPanelProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [askerName, setAskerName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
    
    // Set up real-time subscription for questions
    const channel = supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `meeting_id=eq.${meetingId}`
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!newQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    if (!isAnonymous && !askerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name or submit anonymously",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("questions")
        .insert({
          meeting_id: meetingId,
          question: newQuestion.trim(),
          asker_name: isAnonymous ? null : askerName.trim(),
        });

      if (error) throw error;

      setNewQuestion("");
      if (!isAnonymous) {
        // Keep the name for future questions
      }

      toast({
        title: "Question submitted",
        description: "Your question has been added to the meeting",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question",
        variant: "destructive",
      });
    }
  };

  const toggleAnswered = async (questionId: string, isAnswered: boolean) => {
    try {
      const { error } = await supabase
        .from("questions")
        .update({ is_answered: !isAnswered })
        .eq("id", questionId);

      if (error) throw error;

      toast({
        title: isAnswered ? "Question marked as unanswered" : "Question marked as answered",
        description: "Question status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question status",
        variant: "destructive",
      });
    }
  };

  const unansweredCount = questions.filter(q => !q.is_answered).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Your Question</Label>
            <Textarea
              id="question"
              placeholder="Enter your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous" className="text-sm font-medium">
              Submit anonymously
            </Label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="asker-name">Your Name</Label>
              <Input
                id="asker-name"
                placeholder="Enter your name"
                value={askerName}
                onChange={(e) => setAskerName(e.target.value)}
              />
            </div>
          )}

          <Button onClick={submitQuestion} className="w-full gap-2">
            <Send className="h-4 w-4" />
            Submit Question
          </Button>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Questions ({questions.length})
          </h3>
          {unansweredCount > 0 && (
            <Badge variant="secondary" className="bg-speaking text-white">
              {unansweredCount} pending
            </Badge>
          )}
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No questions yet. Be the first to ask one!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <Card 
                key={question.id} 
                className={`hover:shadow-hover transition-shadow ${
                  question.is_answered ? 'opacity-75' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-lg">{question.question}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAnswered(question.id, question.is_answered)}
                        className={`ml-4 ${
                          question.is_answered 
                            ? 'text-meeting-active hover:text-meeting-active/80' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <CheckCircle className={`h-4 w-4 ${
                          question.is_answered ? 'fill-current' : ''
                        }`} />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {question.asker_name ? (
                          <>
                            <User className="h-4 w-4" />
                            <span>{question.asker_name}</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4" />
                            <span>Anonymous</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {question.is_answered && (
                          <Badge variant="outline" className="text-xs">
                            Answered
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(question.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
