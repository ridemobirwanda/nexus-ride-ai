import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDriverVerificationNotifications = (driverId: string | null) => {
  useEffect(() => {
    if (!driverId) return;

    const checkVerificationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_verification_requests')
          .select('status, rejection_reason, reviewed_at')
          .eq('driver_id', driverId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        // Show notification for approved status
        if (data?.status === 'approved' && data.reviewed_at) {
          const reviewedTime = new Date(data.reviewed_at);
          const now = new Date();
          const timeDiff = now.getTime() - reviewedTime.getTime();
          
          // Only show if reviewed in the last 5 minutes (to avoid old notifications)
          if (timeDiff < 5 * 60 * 1000) {
            toast({
              title: "✅ Verification Approved!",
              description: "Congratulations! Your account has been verified. You can now start accepting rides.",
              duration: 8000,
            });
          }
        }

        // Show notification for rejected status
        if (data?.status === 'rejected') {
          const reason = data.rejection_reason || 'No reason provided';
          toast({
            title: "❌ Verification Rejected",
            description: `Your verification was rejected. Reason: ${reason}. Please contact support or resubmit your documents.`,
            variant: "destructive",
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check initial status
    checkVerificationStatus();

    // Subscribe to real-time verification status changes
    const channel = supabase
      .channel(`verification-notifications-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_verification_requests',
          filter: `driver_id=eq.${driverId}`
        },
        (payload: any) => {
          console.log('Verification status changed:', payload.new);

          if (payload.new.status === 'approved') {
            toast({
              title: "✅ Verification Approved!",
              description: "Congratulations! Your account has been verified. You can now start accepting rides.",
              duration: 8000,
            });
          } else if (payload.new.status === 'rejected') {
            const reason = payload.new.rejection_reason || 'No reason provided';
            toast({
              title: "❌ Verification Rejected",
              description: `Your verification was rejected. Reason: ${reason}. Please contact support or resubmit your documents.`,
              variant: "destructive",
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);
};
