-- Add payment method field to rides table
ALTER TABLE public.rides 
ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'card'));