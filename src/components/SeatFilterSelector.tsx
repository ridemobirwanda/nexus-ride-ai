import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface SeatFilterSelectorProps {
  selectedSeats?: number[];
  onSeatChange: (seats: number[]) => void;
}

const SeatFilterSelector = ({ selectedSeats = [], onSeatChange }: SeatFilterSelectorProps) => {
  const seatOptions = [
    { count: 4, label: '4 Passengers', description: 'Standard cars' },
    { count: 7, label: '7 Passengers', description: 'Family size' },
    { count: 10, label: '10 Passengers', description: 'Group travel' }
  ];

  const toggleSeat = (seatCount: number) => {
    if (selectedSeats.includes(seatCount)) {
      onSeatChange(selectedSeats.filter(s => s !== seatCount));
    } else {
      onSeatChange([...selectedSeats, seatCount]);
    }
  };

  const selectAll = () => {
    onSeatChange(seatOptions.map(s => s.count));
  };

  const clearAll = () => {
    onSeatChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Passenger Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
          >
            All Sizes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
          >
            Clear
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {seatOptions.map((option) => (
            <div
              key={option.count}
              className={`
                p-3 border rounded-lg cursor-pointer transition-all
                ${selectedSeats.includes(option.count) || selectedSeats.length === 0
                  ? 'border-primary bg-primary/10 shadow-sm' 
                  : 'border-muted hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => toggleSeat(option.count)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {selectedSeats.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Showing cars for: {selectedSeats.sort().join(', ')} passengers
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeatFilterSelector;