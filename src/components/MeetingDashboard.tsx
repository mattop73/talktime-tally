import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Clock, MessageSquare } from "lucide-react";
import { CreateMeetingDialog } from "@/components/CreateMeetingDialog";
import { ActiveMeetingView } from "@/components/ActiveMeetingView";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  participants?: any[];
}

export const MeetingDashboard = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
    
    // Set up real-time subscription for meetings so all users see new meetings instantly
    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsChannel);
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          participants(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMeetings(data || []);
      
      // Find active meeting
      const active = data?.find((m) => m.is_active);
      setActiveMeeting(active || null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingCreated = () => {
    fetchMeetings();
    setShowCreateDialog(false);
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", meetingId);

      if (error) throw error;

      toast({
        title: "Meeting ended",
        description: "The meeting has been successfully ended",
      });
      
      fetchMeetings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end meeting",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show active meeting view if there's an active meeting
  if (activeMeeting) {
    return (
      <ActiveMeetingView 
        meeting={activeMeeting} 
        onEndMeeting={handleEndMeeting}
        onRefresh={fetchMeetings}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meeting Dashboard</h1>
          <p className="text-muted-foreground">
            Create and manage your meeting sessions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No meetings yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first meeting to start tracking speaking time
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Create Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{meeting.title}</CardTitle>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meeting.is_active ? 'bg-meeting-active text-white' : 'bg-meeting-inactive text-white'
                }`}>
                  {meeting.is_active ? 'Active' : 'Ended'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {meeting.participants?.length || 0} participants
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(meeting.created_at).toLocaleDateString()}
                  </div>
                </div>
                {meeting.is_active && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setActiveMeeting(meeting)}
                  >
                    Join Meeting
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onMeetingCreated={handleMeetingCreated}
      />
    </div>
  );
};