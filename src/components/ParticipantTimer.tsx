import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  total_speaking_time: number;
  speaking_sessions: number;
  is_currently_speaking: boolean;
}

interface ParticipantTimerProps {
  participant: Participant;
  meetingId: string;
  onUpdate: () => void;
}

export const ParticipantTimer = ({
  participant,
  meetingId,
  onUpdate,
}: ParticipantTimerProps) => {
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (participant.is_currently_speaking) {
      interval = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [participant.is_currently_speaking]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSpeaking = async () => {
    try {
      // First, stop any other participants who might be speaking
      await supabase
        .from("participants")
        .update({ is_currently_speaking: false })
        .eq("meeting_id", meetingId);

      // End any active sessions
      const { data: activeSessions } = await supabase
        .from("speaking_sessions")
        .select("id")
        .eq("meeting_id", meetingId)
        .is("ended_at", null);

      if (activeSessions && activeSessions.length > 0) {
        const now = new Date().toISOString();
        await supabase
          .from("speaking_sessions")
          .update({ ended_at: now })
          .in("id", activeSessions.map(s => s.id));
      }

      // Start new session
      const { data: newSession, error: sessionError } = await supabase
        .from("speaking_sessions")
        .insert({
          participant_id: participant.id,
          meeting_id: meetingId,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update participant status
      await supabase
        .from("participants")
        .update({ is_currently_speaking: true })
        .eq("id", participant.id);

      setActiveSessionId(newSession.id);
      setCurrentSessionTime(0);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start speaking session",
        variant: "destructive",
      });
    }
  };

  const stopSpeaking = async () => {
    try {
      const now = new Date().toISOString();
      const sessionDuration = currentSessionTime;

      // End current session
      if (activeSessionId) {
        await supabase
          .from("speaking_sessions")
          .update({
            ended_at: now,
            duration: sessionDuration,
          })
          .eq("id", activeSessionId);
      }

      // Update participant stats
      await supabase
        .from("participants")
        .update({
          is_currently_speaking: false,
          total_speaking_time: participant.total_speaking_time + sessionDuration,
          speaking_sessions: participant.speaking_sessions + 1,
        })
        .eq("id", participant.id);

      setActiveSessionId(null);
      setCurrentSessionTime(0);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop speaking session",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`transition-all duration-300 ${
      participant.is_currently_speaking 
        ? 'shadow-timer border-speaking bg-gradient-timer' 
        : 'hover:shadow-hover'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              participant.is_currently_speaking 
                ? 'bg-speaking text-white' 
                : 'bg-primary-light text-primary'
            }`}>
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{participant.name}</h3>
              <p className="text-sm text-muted-foreground">
                {participant.speaking_sessions} sessions
              </p>
            </div>
          </div>
          {participant.is_currently_speaking && (
            <Badge variant="secondary" className="bg-speaking text-white animate-pulse">
              Speaking
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-timer-text">
              {participant.is_currently_speaking 
                ? formatTime(currentSessionTime)
                : formatTime(participant.total_speaking_time)
              }
            </div>
            <p className="text-sm text-muted-foreground">
              {participant.is_currently_speaking ? "Current session" : "Total time"}
            </p>
          </div>

          <Button
            onClick={participant.is_currently_speaking ? stopSpeaking : startSpeaking}
            className={`w-full gap-2 ${
              participant.is_currently_speaking
                ? 'bg-speaking hover:bg-speaking/90'
                : ''
            }`}
          >
            {participant.is_currently_speaking ? (
              <>
                <Pause className="h-4 w-4" />
                Stop Speaking
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Speaking
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};