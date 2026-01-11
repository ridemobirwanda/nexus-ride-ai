import { useState } from 'react';
import { Bell, Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentExpiryNotifications } from '@/hooks/useDocumentExpiryNotifications';
import { format, formatDistanceToNow } from 'date-fns';

interface DocumentExpiryNotificationBellProps {
  driverId: string;
}

const documentLabels: Record<string, string> = {
  license: "Driver's License",
  insurance: "Insurance Certificate",
  registration: "Vehicle Registration",
};

export const DocumentExpiryNotificationBell = ({ driverId }: DocumentExpiryNotificationBellProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useDocumentExpiryNotifications(driverId);
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case '7_days':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case '30_days':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTitle = (type: string, docType: string) => {
    const docLabel = documentLabels[docType] || docType;
    switch (type) {
      case 'expired':
        return `${docLabel} Expired`;
      case '7_days':
        return `${docLabel} Expiring in 7 Days`;
      case '30_days':
        return `${docLabel} Expiring in 30 Days`;
      default:
        return `${docLabel} Notification`;
    }
  };

  const getNotificationMessage = (type: string, expiryDate: string) => {
    const formattedDate = format(new Date(expiryDate), 'MMM d, yyyy');
    switch (type) {
      case 'expired':
        return `Your document expired on ${formattedDate}. Please update it immediately to continue driving.`;
      case '7_days':
        return `Your document will expire on ${formattedDate}. Please renew it soon.`;
      case '30_days':
        return `Your document will expire on ${formattedDate}. Consider renewing it.`;
      default:
        return `Expiry date: ${formattedDate}`;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Document Expiry Alerts</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CheckCircle className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium">All documents up to date</p>
              <p className="text-xs text-muted-foreground">
                You'll receive alerts when documents are expiring
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {getNotificationTitle(notification.notification_type, notification.document_type)}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getNotificationMessage(notification.notification_type, notification.expiry_date)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};