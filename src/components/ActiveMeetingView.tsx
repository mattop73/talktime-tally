import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StopCircle, Play, Pause, Trophy, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParticipantsNameList } from "@/components/ParticipantsNameList";
import { SubjectsPanel } from "@/components/SubjectsPanel";
import { QuestionsPanel } from "@/components/QuestionsPanel";
import { Progress } from "@/components/ui/progress";

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
  const [localCounters, setLocalCounters] = useState<Record<string, { startTime: number; baseSeconds: number }>>({});
  const [tick, setTick] = useState(0); // forces re-render each second for live timer
  const [hasNewSubjects, setHasNewSubjects] = useState(false);
  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const { toast } = useToast();

  useEffect(() => {
    fetchParticipants();
    fetchActiveSessions();
    
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
          fetchActiveSessions();
        }
      )
      .subscribe();

    // Also listen for speaking_sessions updates to keep live state accurate
    const sessionsChannel = supabase
      .channel('speaking-sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_sessions', filter: `meeting_id=eq.${meeting.id}` },
        () => {
          fetchActiveSessions();
          fetchParticipants();
        }
      )
      .subscribe();

    // Listen for new subjects
    const subjectsChannel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subjects', filter: `meeting_id=eq.${meeting.id}` },
        () => {
          if (activeTab !== 'subjects') {
            setHasNewSubjects(true);
          }
        }
      )
      .subscribe();

    // Listen for new questions
    const questionsChannel = supabase
      .channel('questions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'questions', filter: `meeting_id=eq.${meeting.id}` },
        () => {
          if (activeTab !== 'questions') {
            setHasNewQuestions(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(subjectsChannel);
      supabase.removeChannel(questionsChannel);
    };
  }, [meeting.id, activeTab]);

  // Local ticking to animate the current speaker time
  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync local counters with database participant state
  useEffect(() => {
    const currentSpeaker = participants.find(p => p.is_currently_speaking);
    
    if (currentSpeaker) {
      // If someone is speaking but we don't have a local counter, start one
      if (!localCounters[currentSpeaker.id]) {
        setLocalCounters({
          [currentSpeaker.id]: {
            startTime: Date.now(),
            baseSeconds: currentSpeaker.total_speaking_time || 0
          }
        });
      }
    } else {
      // If no one is speaking, clear all counters
      if (Object.keys(localCounters).length > 0) {
        setLocalCounters({});
      }
    }
  }, [participants, localCounters]);

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

  const fetchActiveSessions = async () => {
    // Simple approach: just sync who is currently speaking
    // The local counters handle the timing
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

  const getLiveSeconds = (p: Participant) => {
    // Simple local counter that continues from the participant's total time
    const counter = localCounters[p.id];
    if (!counter || !p.is_currently_speaking) return 0;
    
    const elapsedSeconds = Math.floor((Date.now() - counter.startTime) / 1000);
    return elapsedSeconds;
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

      <Tabs 
        defaultValue="leaderboard" 
        className="space-y-6"
        onValueChange={(value) => {
          setActiveTab(value);
          // Clear notifications when switching to that tab
          if (value === 'subjects') setHasNewSubjects(false);
          if (value === 'questions') setHasNewQuestions(false);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard" className="gap-2 relative">
            <Trophy className="h-4 w-4" />
            Leaderboard
            {participants.some(p => p.is_currently_speaking) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse shadow-lg">
                LIVE
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2 relative">
            <FileText className="h-4 w-4" />
            Subjects
            {hasNewSubjects && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-bounce"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2 relative">
            <MessageSquare className="h-4 w-4" />
            Questions
            {hasNewQuestions && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce"></span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Simple colorful selectable names */}
          <Card>
            <CardContent className="p-4">
              <ParticipantsNameList
                participants={participants}
                meetingId={meeting.id}
                onUpdate={() => {
                  fetchParticipants();
                  fetchActiveSessions();
                }}
                onActiveChange={(active) => {
                  if (!active) {
                    // Clear all local counters when no one is speaking
                    setLocalCounters({});
                  } else {
                    // Start a simple local counter for the active participant
                    const participant = participants.find(p => p.id === active.participantId);
                    if (participant) {
                      setLocalCounters({
                        [active.participantId]: {
                          startTime: Date.now(),
                          baseSeconds: participant.total_speaking_time || 0
                        }
                      });
                    }
                  }
                }}
                getCurrentLiveSeconds={(participantId) => {
                  // Return the current live seconds being displayed for this participant
                  const participant = participants.find(p => p.id === participantId);
                  return participant ? getLiveSeconds(participant) : 0;
                }}
              />
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Speaking Time Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // For the currently selected person, show ONLY live session time
                  // For everyone else, show their stored total time
                  const withLive = participants.map((p) => {
                    const live = getLiveSeconds(p);
                    
                    // If this person is currently speaking, show their total time + live counter
                    // Otherwise, show their stored total time
                    const displayTime = p.is_currently_speaking 
                      ? (p.total_speaking_time || 0) + live 
                      : (p.total_speaking_time || 0);
                    
                    return { p, total: displayTime };
                  });
                  const maxTotal = Math.max(1, ...withLive.map((x) => x.total));
                  return withLive
                    .sort((a, b) => b.total - a.total)
                    .map(({ p, total }, index) => (
                      <div key={p.id} className="p-3 rounded-lg bg-gradient-meeting">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getRankIcon(index)}
                            <p className="font-medium">{p.name}</p>
                          </div>
                          <p className="text-2xl font-bold text-timer-text">{formatTime(total)}</p>
                        </div>
                        <div className="mt-2">
                          <Progress value={(total / maxTotal) * 100} />
                        </div>
                      </div>
                    ));
                })()}
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