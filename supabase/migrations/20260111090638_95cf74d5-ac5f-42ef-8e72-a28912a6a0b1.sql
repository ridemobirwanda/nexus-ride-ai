-- Create table to track document expiry dates
CREATE TABLE public.document_expiry_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('license', 'insurance', 'registration')),
  expiry_date DATE NOT NULL,
  reminder_sent_30_days BOOLEAN DEFAULT false,
  reminder_sent_7_days BOOLEAN DEFAULT false,
  reminder_sent_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, document_type)
);

-- Enable RLS
ALTER TABLE public.document_expiry_tracking ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own expiry tracking
CREATE POLICY "Drivers can view their own document expiry"
ON public.document_expiry_tracking
FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Drivers can insert/update their own expiry tracking
CREATE POLICY "Drivers can manage their own document expiry"
ON public.document_expiry_tracking
FOR ALL
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Admins can manage all document expiry records
CREATE POLICY "Admins can manage all document expiry"
ON public.document_expiry_tracking
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create table for expiry notifications/reminders
CREATE TABLE public.document_expiry_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('30_days', '7_days', 'expired')),
  expiry_date DATE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own notifications
CREATE POLICY "Drivers can view their own expiry notifications"
ON public.document_expiry_notifications
FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Drivers can update (mark as read) their own notifications
CREATE POLICY "Drivers can update their own expiry notifications"
ON public.document_expiry_notifications
FOR UPDATE
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- System can insert notifications
CREATE POLICY "System can insert expiry notifications"
ON public.document_expiry_notifications
FOR INSERT
WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all expiry notifications"
ON public.document_expiry_notifications
FOR SELECT
USING (is_admin(auth.uid()));

-- Create function to check and create expiry notifications
CREATE OR REPLACE FUNCTION public.check_document_expiry_and_notify()
RETURNS INTEGER AS $$
DECLARE
  expiry_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Loop through all document expiry records
  FOR expiry_record IN 
    SELECT det.*, d.name as driver_name
    FROM document_expiry_tracking det
    JOIN drivers d ON d.id = det.driver_id
    WHERE det.expiry_date IS NOT NULL
  LOOP
    -- Check for 30 days reminder
    IF expiry_record.expiry_date - CURRENT_DATE <= 30 
       AND expiry_record.expiry_date - CURRENT_DATE > 7
       AND NOT expiry_record.reminder_sent_30_days THEN
      
      INSERT INTO document_expiry_notifications (driver_id, document_type, notification_type, expiry_date)
      VALUES (expiry_record.driver_id, expiry_record.document_type, '30_days', expiry_record.expiry_date);
      
      UPDATE document_expiry_tracking 
      SET reminder_sent_30_days = true, updated_at = now()
      WHERE id = expiry_record.id;
      
      notification_count := notification_count + 1;
    END IF;
    
    -- Check for 7 days reminder
    IF expiry_record.expiry_date - CURRENT_DATE <= 7 
       AND expiry_record.expiry_date - CURRENT_DATE > 0
       AND NOT expiry_record.reminder_sent_7_days THEN
      
      INSERT INTO document_expiry_notifications (driver_id, document_type, notification_type, expiry_date)
      VALUES (expiry_record.driver_id, expiry_record.document_type, '7_days', expiry_record.expiry_date);
      
      UPDATE document_expiry_tracking 
      SET reminder_sent_7_days = true, updated_at = now()
      WHERE id = expiry_record.id;
      
      notification_count := notification_count + 1;
    END IF;
    
    -- Check for expired reminder
    IF expiry_record.expiry_date < CURRENT_DATE 
       AND NOT expiry_record.reminder_sent_expired THEN
      
      INSERT INTO document_expiry_notifications (driver_id, document_type, notification_type, expiry_date)
      VALUES (expiry_record.driver_id, expiry_record.document_type, 'expired', expiry_record.expiry_date);
      
      UPDATE document_expiry_tracking 
      SET reminder_sent_expired = true, updated_at = now()
      WHERE id = expiry_record.id;
      
      notification_count := notification_count + 1;
    END IF;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better query performance
CREATE INDEX idx_document_expiry_driver ON public.document_expiry_tracking(driver_id);
CREATE INDEX idx_document_expiry_date ON public.document_expiry_tracking(expiry_date);
CREATE INDEX idx_expiry_notifications_driver ON public.document_expiry_notifications(driver_id);
CREATE INDEX idx_expiry_notifications_unread ON public.document_expiry_notifications(driver_id, is_read) WHERE is_read = false;