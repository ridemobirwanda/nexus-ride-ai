import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Copy, MessageCircle, Mail, Check, Users, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TripSharingProps {
  rideId: string;
  driverName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  estimatedArrival?: string;
  className?: string;
}

const TripSharing = ({
  rideId,
  driverName,
  pickupAddress,
  dropoffAddress,
  estimatedArrival,
  className
}: TripSharingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');

  // Generate shareable link
  const shareUrl = `${window.location.origin}/track-ride/${rideId}`;
  
  const shareMessage = `🚗 I'm on a ride!\n\n` +
    `👤 Driver: ${driverName || 'Pending'}\n` +
    `📍 From: ${pickupAddress || 'Unknown'}\n` +
    `🎯 To: ${dropoffAddress || 'Unknown'}\n` +
    `${estimatedArrival ? `⏱️ ETA: ${estimatedArrival}\n` : ''}` +
    `\n🔗 Track my ride: ${shareUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Share this link with friends or family"
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_self');
  };

  const shareViaEmail = () => {
    const subject = `Tracking my ride - ${new Date().toLocaleDateString()}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_self');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Track My Ride',
          text: shareMessage,
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const addContact = () => {
    if (newContact && !contacts.includes(newContact)) {
      setContacts([...contacts, newContact]);
      setNewContact('');
      toast({
        title: "Contact Added",
        description: `${newContact} will receive ride updates`
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={shareNative}
        className={cn("gap-2", className)}
      >
        <Share2 className="h-4 w-4" />
        Share Trip
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Share Your Trip
            </DialogTitle>
            <DialogDescription>
              Let friends and family track your ride in real-time for added safety.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex-col gap-1 h-auto py-3"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col gap-1 h-auto py-3"
                onClick={shareViaSMS}
              >
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span className="text-xs">SMS</span>
              </Button>
              <Button
                variant="outline"
                className="flex-col gap-1 h-auto py-3"
                onClick={shareViaEmail}
              >
                <Mail className="h-5 w-5 text-gray-600" />
                <span className="text-xs">Email</span>
              </Button>
            </div>

            {/* Add Emergency Contacts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contacts</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Phone or email"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addContact()}
                />
                <Button onClick={addContact}>Add</Button>
              </div>
              {contacts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {contacts.map((contact, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-muted rounded-full text-xs flex items-center gap-1"
                    >
                      {contact}
                      <button
                        onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Trip Summary */}
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Trip Details</span>
              </div>
              {driverName && <p>Driver: {driverName}</p>}
              {pickupAddress && <p className="text-muted-foreground text-xs">From: {pickupAddress}</p>}
              {dropoffAddress && <p className="text-muted-foreground text-xs">To: {dropoffAddress}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TripSharing;
