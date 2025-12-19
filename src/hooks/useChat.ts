import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  message: string;
  sender_type: 'passenger' | 'driver';
  sender_id: string;
  created_at: string;
}

interface UseChatOptions {
  rideId: string;
  userType: 'passenger' | 'driver';
  userId: string;
}

export const useChat = ({ rideId, userType, userId }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!rideId) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!rideId) return;

    fetchMessages();

    const channel = supabase
      .channel(`chat-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, fetchMessages]);

  // Send a message
  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId || !rideId || isSending) return false;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          ride_id: rideId,
          sender_id: userId,
          sender_type: userType,
          message: text.trim()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isLoading,
    isSending,
    sendMessage
  };
};
