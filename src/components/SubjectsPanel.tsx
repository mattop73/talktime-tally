import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface SubjectsPanelProps {
  meetingId: string;
}

export const SubjectsPanel = ({ meetingId }: SubjectsPanelProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, [meetingId]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject title",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("subjects")
        .insert({
          meeting_id: meetingId,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        });

      if (error) throw error;

      setNewTitle("");
      setNewDescription("");
      fetchSubjects();

      toast({
        title: "Subject added",
        description: "New subject has been added to the meeting",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subject",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-title">Subject Title</Label>
            <Input
              id="subject-title"
              placeholder="Enter subject title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-description">Description (optional)</Label>
            <Textarea
              id="subject-description"
              placeholder="Enter subject description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={addSubject} className="w-full">
            Add Subject
          </Button>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meeting Subjects ({subjects.length})
        </h3>

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No subjects added yet. Add the first subject above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{subject.title}</h4>
                      {subject.description && (
                        <p className="text-muted-foreground mt-2">
                          {subject.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                      <Clock className="h-4 w-4" />
                      {new Date(subject.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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