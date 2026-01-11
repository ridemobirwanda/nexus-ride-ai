import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, AlertTriangle, CheckCircle, Clock, FileText, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast, addDays } from 'date-fns';

interface DocumentExpiry {
  id: string;
  driver_id: string;
  document_type: string;
  expiry_date: string;
  reminder_sent_30_days: boolean;
  reminder_sent_7_days: boolean;
  reminder_sent_expired: boolean;
}

interface DocumentExpiryTrackerProps {
  driverId: string;
}

type DocumentType = 'license' | 'insurance' | 'registration';

const documentLabels: Record<DocumentType, string> = {
  license: "Driver's License",
  insurance: "Insurance Certificate",
  registration: "Vehicle Registration",
};

export const DocumentExpiryTracker = ({ driverId }: DocumentExpiryTrackerProps) => {
  const [expiryData, setExpiryData] = useState<DocumentExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    fetchExpiryData();
  }, [driverId]);

  const fetchExpiryData = async () => {
    try {
      const { data, error } = await supabase
        .from('document_expiry_tracking')
        .select('*')
        .eq('driver_id', driverId);

      if (error) throw error;
      setExpiryData(data || []);
    } catch (error) {
      console.error('Error fetching expiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetExpiry = async (documentType: DocumentType) => {
    if (!editDate) {
      toast({
        title: 'Error',
        description: 'Please select an expiry date',
        variant: 'destructive',
      });
      return;
    }

    try {
      const existingRecord = expiryData.find(d => d.document_type === documentType);

      if (existingRecord) {
        // Update existing record and reset reminder flags
        const { error } = await supabase
          .from('document_expiry_tracking')
          .update({
            expiry_date: editDate,
            reminder_sent_30_days: false,
            reminder_sent_7_days: false,
            reminder_sent_expired: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('document_expiry_tracking')
          .insert({
            driver_id: driverId,
            document_type: documentType,
            expiry_date: editDate,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `${documentLabels[documentType]} expiry date updated`,
      });

      setEditingType(null);
      setEditDate('');
      fetchExpiryData();
    } catch (error) {
      console.error('Error setting expiry date:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expiry date',
        variant: 'destructive',
      });
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = differenceInDays(expiry, today);

    if (isPast(expiry)) {
      return {
        status: 'expired',
        label: 'Expired',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-destructive',
        daysText: `Expired ${Math.abs(daysUntil)} days ago`,
      };
    } else if (daysUntil <= 7) {
      return {
        status: 'urgent',
        label: 'Expiring Soon',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-destructive',
        daysText: `Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      };
    } else if (daysUntil <= 30) {
      return {
        status: 'warning',
        label: 'Expiring',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        daysText: `Expires in ${daysUntil} days`,
      };
    } else {
      return {
        status: 'valid',
        label: 'Valid',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-primary',
        daysText: `Expires in ${daysUntil} days`,
      };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Document Expiry Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Document Expiry Tracking
        </CardTitle>
        <CardDescription>
          Track your document expiry dates and receive automatic reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(documentLabels) as DocumentType[]).map((docType) => {
          const expiry = expiryData.find(d => d.document_type === docType);
          const expiryInfo = expiry ? getExpiryStatus(expiry.expiry_date) : null;
          const StatusIcon = expiryInfo?.icon || FileText;

          return (
            <div
              key={docType}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${expiryInfo?.color || 'text-muted-foreground'}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{documentLabels[docType]}</p>
                  {expiry ? (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Expires: {format(new Date(expiry.expiry_date), 'MMM d, yyyy')}
                      </span>
                      <Badge variant={expiryInfo?.variant} className="text-xs">
                        {expiryInfo?.daysText}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No expiry date set
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingType === docType ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-auto"
                    />
                    <Button size="sm" onClick={() => handleSetExpiry(docType)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingType(null);
                        setEditDate('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingType(docType);
                      setEditDate(expiry?.expiry_date || '');
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {expiry ? 'Update' : 'Set Date'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Summary alert for any expired or expiring documents */}
        {expiryData.some(d => {
          const status = getExpiryStatus(d.expiry_date);
          return status.status === 'expired' || status.status === 'urgent';
        }) && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive text-sm">Action Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  One or more of your documents have expired or are expiring soon. 
                  Please update them to continue accepting rides.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};