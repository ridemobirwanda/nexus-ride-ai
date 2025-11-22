import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VerificationRequest {
  id: string;
  status: string;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  documents: any;
}

interface DriverVerificationStatusProps {
  driverId: string;
}

export const DriverVerificationStatus = ({ driverId }: DriverVerificationStatusProps) => {
  const { t } = useTranslation();
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResubmit, setShowResubmit] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`verification-status-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_verification_requests',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Verification status updated:', payload);
          fetchVerificationStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const fetchVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_verification_requests')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setVerificationRequest(data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    try {
      const { error } = await supabase
        .from('driver_verification_requests')
        .update({
          status: 'pending',
          rejection_reason: null,
          submitted_at: new Date().toISOString()
        })
        .eq('id', verificationRequest?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Verification request resubmitted successfully",
      });
      setShowResubmit(false);
      fetchVerificationStatus();
    } catch (error) {
      console.error('Error resubmitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to resubmit verification request",
        variant: "destructive",
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending Review',
          variant: 'secondary' as const,
          color: 'text-muted-foreground',
          progress: 50,
          description: 'Your verification is under review by our team',
          nextSteps: [
            'Our team is reviewing your submitted documents',
            'This usually takes 24-48 hours',
            'You will be notified once the review is complete'
          ]
        };
      case 'approved':
        return {
          icon: CheckCircle,
          label: 'Verified',
          variant: 'default' as const,
          color: 'text-primary',
          progress: 100,
          description: 'Your account has been successfully verified',
          nextSteps: [
            'You can now accept ride requests',
            'Go online to start receiving ride requests',
            'Maintain good ratings to keep your verified status'
          ]
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          label: 'Rejected',
          variant: 'destructive' as const,
          color: 'text-destructive',
          progress: 25,
          description: 'Your verification was rejected',
          nextSteps: [
            'Review the rejection reason below',
            'Update your documents as needed',
            'Resubmit your verification request'
          ]
        };
      default:
        return {
          icon: FileText,
          label: 'Not Submitted',
          variant: 'outline' as const,
          color: 'text-muted-foreground',
          progress: 0,
          description: 'Complete your verification to start driving',
          nextSteps: [
            'Upload required documents',
            'Submit verification request',
            'Wait for admin approval'
          ]
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = verificationRequest?.status || 'not_submitted';
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
              Verification Status
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
        </div>

        {/* Rejection Reason */}
        {status === 'rejected' && verificationRequest?.rejection_reason && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Rejection Reason:</strong> {verificationRequest.rejection_reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Next Steps */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Next Steps:</h4>
          <ul className="space-y-2">
            {config.nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timestamps */}
        {verificationRequest && (
          <div className="space-y-1 text-xs text-muted-foreground border-t pt-4">
            <p>Submitted: {new Date(verificationRequest.submitted_at).toLocaleString()}</p>
            {verificationRequest.reviewed_at && (
              <p>Reviewed: {new Date(verificationRequest.reviewed_at).toLocaleString()}</p>
            )}
          </div>
        )}

        {/* Resubmit Button */}
        {status === 'rejected' && (
          <div className="pt-2">
            {!showResubmit ? (
              <Button 
                onClick={() => setShowResubmit(true)} 
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Resubmit Documents
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    Make sure you've updated your documents before resubmitting. This will reset your verification status to "Pending".
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleResubmit} 
                    className="flex-1"
                    variant="default"
                  >
                    Confirm Resubmit
                  </Button>
                  <Button 
                    onClick={() => setShowResubmit(false)} 
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
