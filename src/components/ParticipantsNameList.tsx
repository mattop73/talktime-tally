import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  total_speaking_time: number;
  speaking_sessions: number;
  is_currently_speaking: boolean;
}

interface ParticipantsNameListProps {
  participants: Participant[];
  meetingId: string;
  onUpdate: () => void;
  onActiveChange: (active: { participantId: string } | null) => void;
}

export const ParticipantsNameList = ({
  participants,
  meetingId,
  onUpdate,
  onActiveChange,
}: ParticipantsNameListProps) => {
  const [newParticipantName, setNewParticipantName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [activeParticipant, setActiveParticipant] = useState<string | null>(null);
  const { toast } = useToast();

  // Find currently speaking participant
  useEffect(() => {
    const currentlySpeaking = participants.find(p => p.is_currently_speaking);
    if (currentlySpeaking) {
      setActiveParticipant(currentlySpeaking.id);
    } else {
      setActiveParticipant(null);
    }
  }, [participants]);

  const addParticipant = async () => {
    if (!newParticipantName.trim()) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('participants')
        .insert([
          {
            meeting_id: meetingId,
            name: newParticipantName.trim(),
            total_speaking_time: 0,
            speaking_sessions: 0,
            is_currently_speaking: false,
          }
        ]);

      if (error) throw error;

      setNewParticipantName("");
      onUpdate();
      toast({
        title: "Success",
        description: "Participant added successfully",
      });
    } catch (error) {
      console.error('Error adding participant:', error);
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      onUpdate();
      toast({
        title: "Success",
        description: "Participant removed successfully",
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    }
  };

  const toggleParticipantSpeaking = async (participantId: string) => {
    try {
      const participant = participants.find(p => p.id === participantId);
      if (!participant) return;

      const newStatus = !participant.is_currently_speaking;

      // If starting to speak, stop all other participants first
      if (newStatus) {
        await supabase
          .from('participants')
          .update({ is_currently_speaking: false })
          .eq('meeting_id', meetingId);
      }

      // Update the selected participant
      const { error } = await supabase
        .from('participants')
        .update({ is_currently_speaking: newStatus })
        .eq('id', participantId);

      if (error) throw error;

      // If starting to speak, create a speaking session
      if (newStatus) {
        const { error: sessionError } = await supabase
          .from('speaking_sessions')
          .insert([
            {
              participant_id: participantId,
              meeting_id: meetingId,
              start_time: new Date().toISOString(),
            }
          ]);

        if (sessionError) throw sessionError;
        
        setActiveParticipant(participantId);
        onActiveChange({ participantId });
      } else {
        // End the current speaking session
        const { error: endError } = await supabase
          .from('speaking_sessions')
          .update({ end_time: new Date().toISOString() })
          .eq('participant_id', participantId)
          .is('end_time', null);

        if (endError) throw endError;

        setActiveParticipant(null);
        onActiveChange(null);
      }

      onUpdate();
    } catch (error) {
      console.error('Error toggling participant speaking:', error);
      toast({
        title: "Error",
        description: "Failed to update speaking status",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add participant name..."
          value={newParticipantName}
          onChange={(e) => setNewParticipantName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
          disabled={isAdding}
        />
        <Button 
          onClick={addParticipant} 
          disabled={!newParticipantName.trim() || isAdding}
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
              participant.is_currently_speaking
                ? 'border-green-500 bg-green-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => toggleParticipantSpeaking(participant.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">{participant.name}</h3>
              <div className="flex items-center gap-1">
                {participant.is_currently_speaking ? (
                  <Pause className="w-4 h-4 text-green-600" />
                ) : (
                  <Play className="w-4 h-4 text-gray-400" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeParticipant(participant.id);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total Time:</span>
                <span>{formatTime(participant.total_speaking_time)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Sessions:</span>
                <span>{participant.speaking_sessions}</span>
              </div>
            </div>

            {participant.is_currently_speaking && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-green-500 text-white text-xs"
              >
                Speaking
              </Badge>
            )}
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No participants yet. Add some participants to get started!</p>
        </div>
      )}
    </div>
  );
};
