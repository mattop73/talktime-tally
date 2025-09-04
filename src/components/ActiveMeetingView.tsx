import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StopCircle, Play, Pause, Trophy, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParticipantTimer } from "@/components/ParticipantTimer";
import { SubjectsPanel } from "@/components/SubjectsPanel";
import { QuestionsPanel } from "@/components/QuestionsPanel";

interface Participant {
  id: string;
  name: string;
  total_speaking_time: number;
  speaking_sessions: number;
  is_currently_speaking: boolean;
}

interface Meeting {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface ActiveMeetingViewProps {
  meeting: Meeting;
  onEndMeeting: (meetingId: string) => void;
  onRefresh: () => void;
}

export const ActiveMeetingView = ({
  meeting,
  onEndMeeting,
  onRefresh,
}: ActiveMeetingViewProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchParticipants();
    
    // Set up real-time subscription for participants
    const channel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `meeting_id=eq.${meeting.id}`
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meeting.id]);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("meeting_id", meeting.id)
        .order("total_speaking_time", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-leaderboard-gold" />;
      case 1:
        return <Trophy className="h-5 w-5 text-leaderboard-silver" />;
      case 2:
        return <Trophy className="h-5 w-5 text-leaderboard-bronze" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Meeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="bg-meeting-active text-white">
              Live Meeting
            </Badge>
            <span className="text-muted-foreground">
              Started {new Date(meeting.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => onEndMeeting(meeting.id)}
          className="gap-2"
        >
          <StopCircle className="h-4 w-4" />
          End Meeting
        </Button>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2">
            <FileText className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Participants Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <ParticipantTimer
                key={participant.id}
                participant={participant}
                meetingId={meeting.id}
                onUpdate={fetchParticipants}
              />
            ))}
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Speaking Time Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-meeting"
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(index)}
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.speaking_sessions} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-timer-text">
                        {formatTime(participant.total_speaking_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectsPanel meetingId={meeting.id} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsPanel meetingId={meeting.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};