import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Smartphone, CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  onPaymentMethodChange: (method: 'cash' | 'mobile_money' | 'card') => void;
  disabled?: boolean;
}

const PaymentMethodSelector = ({
  paymentMethod,
  onPaymentMethodChange,
  disabled = false
}: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Payment Method</Label>
      <RadioGroup
        value={paymentMethod}
        onValueChange={onPaymentMethodChange}
        className="grid grid-cols-1 gap-3"
        disabled={disabled}
      >
        <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors">
          <RadioGroupItem value="cash" id="cash" disabled={disabled} />
          <div className="flex items-center gap-2 flex-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <Label htmlFor="cash" className="cursor-pointer flex-1">Cash Payment</Label>
          </div>
        </div>
        <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors">
          <RadioGroupItem value="mobile_money" id="mobile_money" disabled={disabled} />
          <div className="flex items-center gap-2 flex-1">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <Label htmlFor="mobile_money" className="cursor-pointer flex-1">Mobile Money</Label>
          </div>
        </div>
        <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/30 transition-colors opacity-50">
          <RadioGroupItem value="card" id="card" disabled />
          <div className="flex items-center gap-2 flex-1">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <Label htmlFor="card" className="cursor-pointer flex-1">Card Payment (Coming Soon)</Label>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PaymentMethodSelector;