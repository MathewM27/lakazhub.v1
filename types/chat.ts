// Chat system types based on database schema

// Message within a conversation
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Property conversation
export interface Conversation {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  messages: Message[];
  last_message_text: string | null;
  last_message_at: string;
  landlord_unread_count: number;
  tenant_unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// Property type (simplified, add more fields as needed)
export interface Property {
  id: string;
  name: string;
  location: string;
  description?: string;
  image?: string;
  price?: number;
  landlord_id: string;
  // Add other property fields as needed
}

// User profile type
export interface Profile {
  id: string;
  full_name: string;
  email_address?: string;
  profile_photo?: string;
  user_role: 'tenant' | 'landlord' | 'admin';
  phone_number?: string;
  // Add other profile fields as needed
}

// Conversation with additional data for display
export interface ConversationWithExtras extends Conversation {
  property: Property;
  landlord: Profile;
  tenant: Profile;
  last_message?: Message | null;
  last_message_time?: string;
  unread_count?: number;
}

// Grouped conversations by landlord
export interface LandlordGroup {
  landlord_id: string;
  landlord: Profile;
  conversations: ConversationWithExtras[];
  unread_count: number;
  last_message_time?: string;
}

// Payload from Supabase realtime subscription
export interface RealtimePayload<T> {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

// Notification type
export interface Notification {
  message_id: string;
  property_id: string;
  property_name: string;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_photo?: string;
  message: string;
  created_at: string;
  conversation_id: string;
  unread_count: number;
}

// User conversation summary
export interface UserConversation {
  conversation_id: string;
  property_id: string;
  property_name: string;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_photo?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Property conversation summary
export interface PropertyConversation {
  conversation_id: string;
  counterparty_name: string;
  counterparty_photo?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}
