import { Coins } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/hooks/useCurrency';

export function CurrencySwitcher() {
  const { display, enabled, setCurrency } = useCurrency();
  if (enabled.length <= 1) return null;

  return (
    <Select value={display} onValueChange={setCurrency}>
      <SelectTrigger className="h-9 w-[96px] gap-1" aria-label="Display currency">
        <Coins className="h-4 w-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {enabled.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
