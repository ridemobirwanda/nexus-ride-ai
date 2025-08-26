import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';

interface RideCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const RideCancelModal = ({ isOpen, onClose, onConfirm, isLoading = false }: RideCancelModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const predefinedReasons = [
    'Change of plans',
    'Found alternative transport',
    'Taking too long to find driver',
    'Wrong pickup location',
    'Driver not responding',
    'Other'
  ];

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    onConfirm(reason);
  };

  const isValid = selectedReason && (selectedReason !== 'Other' || customReason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Ride
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please let us know why you're cancelling your ride. This helps us improve our service.
          </p>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {predefinedReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="text-sm cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please specify:</Label>
              <Textarea
                id="custom-reason"
                placeholder="Tell us more about your reason for cancelling..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Ride
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Ride'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RideCancelModal;