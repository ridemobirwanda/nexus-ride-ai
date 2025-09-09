-- Create payments table for ride-hailing system
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own ride payments" 
ON public.payments 
FOR SELECT 
USING (ride_id IN (
  SELECT r.id FROM public.rides r
  JOIN public.passengers p ON r.passenger_id = p.id
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Drivers can view payments for their rides" 
ON public.payments 
FOR SELECT 
USING (ride_id IN (
  SELECT r.id FROM public.rides r
  JOIN public.drivers d ON r.driver_id = d.id
  WHERE d.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payments" 
ON public.payments 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process payment
CREATE OR REPLACE FUNCTION public.process_payment(
  p_ride_id UUID,
  p_method TEXT,
  p_amount NUMERIC
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Insert payment record
  INSERT INTO public.payments (ride_id, method, amount, status)
  VALUES (p_ride_id, p_method, p_amount, 'completed')
  RETURNING id INTO v_payment_id;
  
  -- Update ride with final fare
  UPDATE public.rides 
  SET final_fare = p_amount, status = 'completed'
  WHERE id = p_ride_id;
  
  RETURN v_payment_id;
END;
$$;