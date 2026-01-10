import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverVerificationProps {
  userRole: string | null;
}

interface VerificationRequest {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string | null;
  driver_photo: string | null;
  status: string;
  documents: {
    license?: string;
    insurance?: string;
    registration?: string;
  };
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function DriverVerification({ userRole }: DriverVerificationProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("driver_verification_requests")
        .select(`
          id,
          driver_id,
          status,
          documents,
          rejection_reason,
          submitted_at,
          reviewed_at,
          reviewed_by,
          drivers!inner(name, phone, photo_url)
        `)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      const formattedRequests = data?.map(request => ({
        id: request.id,
        driver_id: request.driver_id,
        driver_name: request.drivers?.name || "Unknown",
        driver_phone: request.drivers?.phone || null,
        driver_photo: request.drivers?.photo_url || null,
        status: request.status,
        documents: typeof request.documents === 'object' && request.documents !== null 
          ? request.documents as { license?: string; insurance?: string; registration?: string }
          : {},
        rejection_reason: request.rejection_reason,
        submitted_at: request.submitted_at,
        reviewed_at: request.reviewed_at,
        reviewed_by: request.reviewed_by,
      })) || [];

      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch verification requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Get the driver_id from the verification request
      const { data: verificationData, error: fetchError } = await supabase
        .from("driver_verification_requests")
        .select("driver_id")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update verification request status
      const { error: verificationError } = await supabase
        .from("driver_verification_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (verificationError) throw verificationError;

      // Update driver status to available
      if (verificationData?.driver_id) {
        const { error: driverError } = await supabase
          .from("drivers")
          .update({
            status: "available",
            is_available: true
          })
          .eq("id", verificationData.driver_id);

        if (driverError) throw driverError;
      }

      toast({
        title: "Success",
        description: "Driver verification approved successfully. Driver can now start accepting rides.",
      });

      fetchVerificationRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve verification.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the driver_id from the verification request
      const { data: verificationData, error: fetchError } = await supabase
        .from("driver_verification_requests")
        .select("driver_id")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update verification request status
      const { error: verificationError } = await supabase
        .from("driver_verification_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (verificationError) throw verificationError;

      // Keep driver status as offline so they cannot accept rides
      if (verificationData?.driver_id) {
        const { error: driverError } = await supabase
          .from("drivers")
          .update({
            status: "offline",
            is_available: false
          })
          .eq("id", verificationData.driver_id);

        if (driverError) throw driverError;
      }

      toast({
        title: "Success",
        description: "Driver verification rejected. Driver has been notified.",
      });

      setRejectionReason("");
      fetchVerificationRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject verification.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Driver Verification</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Driver Verification</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{statusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{statusCounts.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{statusCounts.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>
            Review and approve driver verification documents
          </CardDescription>
        </CardHeader>
              <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No verification requests</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                There are no driver verification requests at this time. New driver registrations will appear here for approval.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.driver_name}</TableCell>
                  <TableCell>{request.driver_phone || "Not provided"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)} className="capitalize">
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {Object.keys(request.documents).filter(k => request.documents[k as keyof typeof request.documents]).length} / 3 docs
                    </div>
                  </TableCell>
                  <TableCell>{new Date(request.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Verification Request Details</DialogTitle>
                            <DialogDescription>
                              Review driver documents and make a decision
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Driver Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Name:</span>
                                      <span>{selectedRequest.driver_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span>{selectedRequest.driver_phone || "Not provided"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Status:</span>
                                      <Badge variant={getStatusBadgeVariant(selectedRequest.status)} className="capitalize">
                                        {selectedRequest.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Submission Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Submitted:</span>
                                      <span>{new Date(selectedRequest.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Documents:</span>
                                      <span>{Object.keys(selectedRequest.documents).filter(k => selectedRequest.documents[k as keyof typeof selectedRequest.documents]).length} / 3</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Verification Documents</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {(['license', 'insurance', 'registration'] as const).map((docType) => {
                                    const docUrl = selectedRequest.documents[docType];
                                    const labels = {
                                      license: "Driver's License",
                                      insurance: "Insurance Certificate", 
                                      registration: "Vehicle Registration"
                                    };
                                    return (
                                      <div key={docType} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium">{labels[docType]}</span>
                                          {docUrl ? (
                                            <Badge variant="default" className="text-xs">Uploaded</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-xs">Missing</Badge>
                                          )}
                                        </div>
                                        {docUrl ? (
                                          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                            <img 
                                              src={docUrl} 
                                              alt={labels[docType]}
                                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => window.open(docUrl, '_blank')}
                                            />
                                          </div>
                                        ) : (
                                          <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center border border-dashed">
                                            <FileText className="w-8 h-8 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {selectedRequest.rejection_reason && (
                                <div>
                                  <h4 className="font-medium mb-2">Rejection Reason</h4>
                                  <p className="text-sm text-muted-foreground p-3 bg-destructive/10 rounded-lg">
                                    {selectedRequest.rejection_reason}
                                  </p>
                                </div>
                              )}

                              {selectedRequest.status === "pending" && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Rejection Reason (if rejecting)</h4>
                                    <Textarea
                                      placeholder="Provide a reason for rejection..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                                      disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => handleApprove(selectedRequest.id)}
                                      disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(request.id, "Quick rejection")}
                            disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}