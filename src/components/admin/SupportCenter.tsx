import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportCenterProps {
  userRole: string | null;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  user_name: string | null;
  user_type: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages_count: number;
}

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
  is_internal: boolean;
}

export function SupportCenter({ userRole }: SupportCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          ticket_number,
          subject,
          description,
          category,
          priority,
          status,
          user_type,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get message counts for each ticket
      const ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from("support_ticket_messages")
            .select("*", { count: "exact" })
            .eq("ticket_id", ticket.id);

          return {
            ...ticket,
            user_name: null, // Would need to join with users table
            messages_count: count || 0,
          };
        })
      );

      setTickets(ticketsWithCounts);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch ticket messages.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("support_ticket_messages")
        .insert([{
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: "admin",
          message: newMessage,
          is_internal: false,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully.",
      });

      setNewMessage("");
      fetchTicketMessages(ticketId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === "resolved" || status === "closed") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ticket status updated to ${status}.`,
      });

      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "in_progress":
        return "secondary";
      case "resolved":
        return "default";
      case "closed":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "secondary";
      case "medium":
        return "outline";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.user_name && ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ticketsByStatus = {
    all: filteredTickets,
    open: filteredTickets.filter(t => t.status === 'open'),
    in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
    resolved: filteredTickets.filter(t => t.status === 'resolved'),
    closed: filteredTickets.filter(t => t.status === 'closed'),
  };

  const TicketTable = ({ tickets }: { tickets: SupportTicket[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket #</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Messages</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
            <TableCell className="font-medium max-w-xs">
              <div className="truncate">{ticket.subject}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {ticket.user_type || "Unknown"} user
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {ticket.category.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getPriorityBadgeVariant(ticket.priority)} className="capitalize">
                {ticket.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ticket.status)} className="capitalize">
                {ticket.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                {ticket.messages_count}
              </div>
            </TableCell>
            <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setNewStatus(ticket.status);
                      fetchTicketMessages(ticket.id);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ticket #{selectedTicket?.ticket_number}</DialogTitle>
                    <DialogDescription>
                      {selectedTicket?.subject}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedTicket && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Ticket Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <Badge variant="outline" className="capitalize">
                                {selectedTicket.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Priority:</span>
                              <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)} className="capitalize">
                                {selectedTicket.priority}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">User Type:</span>
                              <span className="capitalize">{selectedTicket.user_type || "Unknown"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Status Management</h4>
                          <div className="space-y-2">
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStatus(selectedTicket.id, newStatus)}
                              disabled={newStatus === selectedTicket.status}
                            >
                              Update Status
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Original Issue</h4>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm">{selectedTicket.description}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Conversation</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {messages.map((message) => (
                            <div 
                              key={message.id} 
                              className={`p-3 rounded-lg ${
                                message.sender_type === 'admin' 
                                  ? 'bg-primary/10 ml-4' 
                                  : 'bg-muted/50 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant={message.sender_type === 'admin' ? 'default' : 'outline'}>
                                  {message.sender_type === 'admin' ? 'Support Agent' : 'User'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{message.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Send Reply</h4>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Type your response..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                          />
                          <Button onClick={() => handleSendMessage(selectedTicket.id)}>
                            Send Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Support Center</h2>
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
        <h2 className="text-2xl font-bold">Support Center</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {ticketsByStatus.open.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {ticketsByStatus.in_progress.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {ticketsByStatus.resolved.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({ticketsByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({ticketsByStatus.open.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({ticketsByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({ticketsByStatus.resolved.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({ticketsByStatus.closed.length})</TabsTrigger>
        </TabsList>

        {Object.entries(ticketsByStatus).map(([status, tickets]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  {status === 'all' ? 'All Support Tickets' : `${status.replace('_', ' ')} Tickets`}
                </CardTitle>
                <CardDescription>
                  {status === 'all' 
                    ? 'Complete overview of all support tickets'
                    : `Support tickets currently ${status.replace('_', ' ')}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketTable tickets={tickets} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}