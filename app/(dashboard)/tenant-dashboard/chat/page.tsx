"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utils/lib/utils";
import Navigation from "../components/navigation/Navbar";
import { supabase } from "../utils/supabase/client";
import { useToast } from "../hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

// Import types from our centralized type definitions
import {
  ConversationWithExtras,
  LandlordGroup,
  Message,
  Profile,
} from '@/utils/types/chat';

// Create a simple cache for conversations
const conversationsCache = new Map<string, { data: ConversationWithExtras[], timestamp: number }>();
// Add a cache for messages per conversation
const messagesCache = new Map<string, { messages: Message[]; timestamp: number }>();
// Define TTL for cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const MESSAGE_CACHE_TTL = 5 * 60 * 1000;

// Move formatMessageTime outside the component to avoid hooks rule violations
function formatMessageTime(timestamp: string) {
  try {
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    }

    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }

    return format(date, "MMM d");
  } catch {
    return "Unknown";
  }
}

// Define additional interfaces for API responses
interface ConversationData {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  last_message_text?: string;
  last_message_at?: string;
  tenant_unread_count: number;
  landlord_unread_count: number;
  properties?: {
    id: string;
    name: string;
    images?: string[] | string;
    image?: string;
    location?: string;
  };
  messages?: Message[];
}

interface PropertyData {
  id: string;
  name: string;
  images?: string[] | string;
  image?: string;
  location?: string;
}

interface LandlordData {
  id: string;
  full_name: string;
  profile_photo?: string;
  user_role?: string;
  email_address?: string;
}

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithExtras | null>(null);
  const [conversations, setConversations] = useState<ConversationWithExtras[]>([]);
  const [landlordGroups, setLandlordGroups] = useState<LandlordGroup[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 10; // Number of messages to load per page
  // Add state to track if there are more messages to load - moved up here
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const [loadingConversation, setLoadingConversation] = useState(false);
  
  // Add a state to track if we've prefetched data
  const [hasPrefetched, setHasPrefetched] = useState(false);
  
  // Add a new loading state indicator specifically for initial page load
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const handleConversationClick = async (conversation: ConversationWithExtras) => {
    setLoadingConversation(true); // Start loading
    setSelectedConversation(conversation);

    // Mark messages as read in the database
    await supabase.rpc('mark_conversation_messages_read', {
      p_conversation_id: conversation.id,
    });

    // Update the UI to remove the green dot immediately
    setLandlordGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        conversations: group.conversations.map((conv) =>
          conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
        ),
      }))
    );

    setLoadingConversation(false); // Stop loading
  };

  const handleBackClick = () => {
    setLoadingConversation(true); // Start loading
    setTimeout(() => {
      setSelectedConversation(null);
      setLoadingConversation(false); // Stop loading
    }, 300); // Simulate a short delay for better UX
  };

  // Check if we're in mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        
        // Verify user is a tenant
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError || profileData?.user_role !== 'tenant') {
          toast({
            title: "Access Denied",
            description: "This chat interface is only for tenants",
          });
        }
      }
    };
    
    fetchUser();
  }, [toast]);

  // Optimize conversation fetching with caching
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Check cache first
      const cacheKey = `conversations-${user.id}`;
      const cachedData = conversationsCache.get(cacheKey);
      const now = Date.now();
      
      // Use cached data if available and not expired
      if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
        setConversations(cachedData.data);
        groupConversationsByLandlord(cachedData.data);
        setLoading(false);
        setRefreshing(false);
        setLastRefreshed(new Date(cachedData.timestamp));
        setInitialPageLoad(false);
        return;
      }
      
      // Try to use the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_conversations');
      
      if (rpcError) {
        // If RPC fails, fall back to direct query approach
        // Get all conversations for the current user
        const { data: conversationsData, error: convError } = await supabase
          .from('property_conversations')
          .select('id, property_id, tenant_id, landlord_id, last_message_text, last_message_at, tenant_unread_count')
          .eq('tenant_id', user.id)
          .eq('is_archived', false)
          .order('last_message_at', { ascending: false });
        
        if (convError) throw convError;
        
        if (!conversationsData || conversationsData.length === 0) {
          setConversations([]);
          setLandlordGroups([]);
          setLoading(false);
          setRefreshing(false);
          setLastRefreshed(new Date());
          setInitialPageLoad(false);
          return;
        }
        
        // Get property details
        const propertyIds: string[] = conversationsData.map((conv: ConversationData) => conv.property_id);
        const { data: propertiesData, error: propError } = await supabase
          .from('properties')
          .select('id, name, images, location')
          .in('id', propertyIds);
        
        if (propError) throw propError;
        
        // Map properties by ID for easier lookup
        const propertiesMap: Record<string, PropertyData> = {};
        if (propertiesData) {
          propertiesData.forEach((prop: PropertyData) => {
            propertiesMap[prop.id] = prop;
          });
        }
        
        // Get landlord profiles
        const landlordIds: string[] = conversationsData.map((conv: ConversationData): string => conv.landlord_id);
        const { data: landlordData, error: landlordError } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo, user_role')
          .in('id', landlordIds);
        
        if (landlordError) throw landlordError;
        
        // Map landlords by ID for easier lookup
        const landlordsMap: Record<string, LandlordData> = {};
        if (landlordData) {
          landlordData.forEach((landlord: LandlordData) => {
            landlordsMap[landlord.id] = landlord;
          });
        }
        
        // Combine all data into conversation objects
        const conversationsWithExtras: ConversationWithExtras[] = await Promise.all(
          conversationsData.map(async (conv: ConversationData) => {
            const property = propertiesMap[conv.property_id] || { 
              id: conv.property_id,
              name: 'Unknown Property',
              location: 'Unknown Location',
              images: []
            };
            
            const landlord = landlordsMap[conv.landlord_id] || {
              id: conv.landlord_id,
              full_name: 'Unknown Landlord'
            };
            
            // Get the last message from property_messages table
            const { data: lastMessageData, error: msgError } = await supabase
              .from('property_messages')
              .select('id, sender_id, recipient_id, message, created_at, is_read')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            
            let lastMessage = null;
            if (!msgError && lastMessageData) {
              lastMessage = lastMessageData;
            }
            
            return {
              id: conv.id,
              property_id: conv.property_id,
              tenant_id: conv.tenant_id,
              landlord_id: conv.landlord_id,
              last_message_text: conv.last_message_text || '',
              last_message_at: conv.last_message_at || new Date().toISOString(),
              tenant_unread_count: conv.tenant_unread_count || 0,
              landlord_unread_count: 0, // Default value since we don't have this in the query
              property: {
                ...property,
                image: Array.isArray(property.images) && property.images.length > 0 
                  ? property.images[0] 
                  : (typeof property.images === 'string' ? property.images : null)
              },
              landlord,
              tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
              last_message: lastMessage,
              last_message_time: lastMessage ? formatMessageTime(lastMessage.created_at) : 
                                conv.last_message_at ? formatMessageTime(conv.last_message_at) : '',
              unread_count: conv.tenant_unread_count || 0,
              messages: [],
              is_archived: false, // Default value
              created_at: new Date().toISOString(), // Placeholder value
              updated_at: new Date().toISOString() // Placeholder value
            };
          })
        );
        
        // Update cache
        conversationsCache.set(cacheKey, { 
          data: conversationsWithExtras, 
          timestamp: now 
        });
        
        setConversations(conversationsWithExtras);
        groupConversationsByLandlord(conversationsWithExtras);
        setLoading(false);
        setRefreshing(false);
        setLastRefreshed(new Date());
        setInitialPageLoad(false);
        return;
      }
      
      // If RPC succeeded, process the data
      if (rpcData && Array.isArray(rpcData)) {
        interface RPCConversationData {
          conversation_id: string;
          property_id: string;
          property_name?: string;
          counterparty_id: string;
          counterparty_name?: string;
          counterparty_photo?: string;
          last_message?: string;
          last_message_at?: string;
          unread_count?: number;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        }

        const conversationsWithExtras: ConversationWithExtras[] = await Promise.all(
          rpcData.map(async (conv: RPCConversationData) => {
            // Get the property details
            const { data: propertyData, error: propertyError } = await supabase
              .from('properties')
              .select('id, name, images, location')
              .eq('id', conv.property_id)
              .single();
            
            // Get the last message if needed
            let lastMessage = null;
            if (!conv.last_message || !conv.last_message_at) {
              const { data: lastMessageData, error: msgError } = await supabase
                .from('property_messages')
                .select('id, sender_id, recipient_id, message, created_at, is_read')
                .eq('conversation_id', conv.conversation_id)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();
              
              if (!msgError && lastMessageData) {
                lastMessage = lastMessageData;
              }
            }
            
            const property = propertyError ? {
              id: conv.property_id,
              name: conv.property_name || 'Unknown Property',
              location: 'Unknown Location',
              images: []
            } : propertyData;
            
            return {
              id: conv.conversation_id,
              property_id: conv.property_id,
              tenant_id: user.id,
              landlord_id: conv.counterparty_id,
              last_message_text: conv.last_message || '',
              last_message_at: conv.last_message_at || new Date().toISOString(),
              tenant_unread_count: conv.unread_count || 0,
              landlord_unread_count: 0, // Default since we don't have this from RPC
              is_archived: conv.is_archived || false,
              created_at: conv.created_at || new Date().toISOString(),
              updated_at: conv.updated_at || new Date().toISOString(),
              property: {
                ...property,
                image: Array.isArray(property?.images) && property?.images.length > 0 
                  ? property.images[0] 
                  : (typeof property?.images === 'string' ? property.images : null)
              },
              landlord: {
                id: conv.counterparty_id,
                full_name: conv.counterparty_name || 'Unknown Landlord',
                profile_photo: conv.counterparty_photo,
                user_role: 'landlord' // Add this line to fix the type error
              },
              tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
              last_message: lastMessage || {
                message: conv.last_message,
                created_at: conv.last_message_at
              },
              last_message_time: formatMessageTime(lastMessage?.created_at || conv.last_message_at || ''),
              unread_count: conv.unread_count || 0,
              messages: []
            };
          })
        );
        
        // Update cache
        conversationsCache.set(cacheKey, { 
          data: conversationsWithExtras, 
          timestamp: now 
        });
        
        setConversations(conversationsWithExtras);
        groupConversationsByLandlord(conversationsWithExtras);
      }
    } catch (error: unknown) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error loading conversations",
        description: error instanceof Error ? error.message : "Could not load your conversations",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefreshed(new Date());
      setInitialPageLoad(false);
    }
  }, [user?.id, toast, user?.user_metadata?.full_name]);

  // Use prefetching to load data earlier
  useEffect(() => {
    // Prefetch conversations as soon as we have a user ID
    if (user?.id && !hasPrefetched) {
      fetchConversations();
      setHasPrefetched(true);
    }
  }, [user?.id, hasPrefetched, fetchConversations]);

  // Group conversations by landlord
  const groupConversationsByLandlord = useCallback((convs: ConversationWithExtras[]) => {
    const groups: Record<string, LandlordGroup> = {};
    
    convs.forEach((conv: ConversationWithExtras) => {
      const landlordId = conv.landlord_id;
      
      if (!groups[landlordId]) {
        groups[landlordId] = {
          landlord_id: landlordId,
          landlord: conv.landlord,
          conversations: [],
          unread_count: 0,
          last_message_time: conv.last_message_time
        };
      }
      
      groups[landlordId].conversations.push(conv);
      groups[landlordId].unread_count += (conv.unread_count || 0);
      
      // Update the group's last message time if this conversation has a more recent message
      if (conv.last_message_time) {
        const currentTime = groups[landlordId].last_message_time;
        if (!currentTime || new Date(conv.last_message_time) > new Date(currentTime)) {
          groups[landlordId].last_message_time = conv.last_message_time;
        }
      }
    });
    
    // Convert to array and sort by last message time
    const groupsArray = Object.values(groups).sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });
    
    setLandlordGroups(groupsArray);
  }, []);

  // Add a function to fetch messages for a conversation, using cache
  const fetchMessagesForConversation = useCallback(async (conversationId: string) => {
    const cacheKey = `messages-${conversationId}`;
    const cached = messagesCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < MESSAGE_CACHE_TTL) {
      setMessages(cached.messages);
      setLoading(false);
      return cached.messages;
    }

    setLoading(true);
    try {
      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_conversation_messages", {
        p_conversation_id: conversationId,
        p_page: 0,
        p_page_size: 50
      });
      
      if (rpcError) {
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from('property_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
          
        if (directError) throw directError;
        
        messagesCache.set(cacheKey, { messages: directData, timestamp: now });
        setMessages(directData);
        setLoading(false);
        return directData;
      }
      
      // RPC query succeeded
      messagesCache.set(cacheKey, { messages: rpcData, timestamp: now });
      setMessages(rpcData);
      setLoading(false);
      return rpcData;
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setLoading(false);
      return [];
    }
  }, []);

  // Add a function to load more messages when scrolling up
  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || loading) return;
    
    setLoading(true);
    
    try {
      const nextPage = currentPage + 1;
      
      // Fetch older messages
      const { data: olderMessages, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: selectedConversation.id,
        p_page: nextPage,
        p_page_size: PAGE_SIZE
      });
      
      if (error) throw error;
      
      if (olderMessages && olderMessages.length > 0) {
        // Prepend older messages to the start of the array (not the end)
        setMessages(prev => [...olderMessages, ...prev]);
        setCurrentPage(nextPage);
        
        // Check if we have more messages to load
        if (olderMessages.length < PAGE_SIZE) {
          // No more messages to load
          setHasMoreMessages(false);
        } else {
          setHasMoreMessages(true);
        }
      } else {
        // No more messages
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast({
        title: "Error loading messages",
        description: "Could not load older messages",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, loading, currentPage, PAGE_SIZE, toast]);

  // Add scroll position tracking 
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;
      
      // If scrolled near the top and we have more messages, load them
      if (container.scrollTop < 50 && hasMoreMessages && !loading) {
        loadMoreMessages();
      }
    };
    
    const container = messagesContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, loading, loadMoreMessages]);

  // Update: When a new message arrives, scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // When selecting a new conversation, reset pagination and fetch messages
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    
    // Reset pagination when conversation changes
    setCurrentPage(0);
    setHasMoreMessages(true);
    
    // Mark messages as read
    supabase.rpc('mark_conversation_messages_read', {
      p_conversation_id: selectedConversation.id
    });
    
    // Fetch messages for the selected conversation
    const fetchMessagesForSelectedConversation = async () => {
      setLoading(true);
      
      try {
        // Try to use the RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_conversation_messages', {
          p_conversation_id: selectedConversation.id,
          p_page: 0,
          p_page_size: PAGE_SIZE
        });
        
        if (rpcError) {
          // Fall back to direct query
          const { data: messagesData, error: messagesError } = await supabase
            .from('property_messages')
            .select('*')
            .eq('conversation_id', selectedConversation.id)
            .order('created_at', { ascending: true })
            .limit(PAGE_SIZE);
          
          if (messagesError) throw messagesError;
          
          setMessages(messagesData || []);
          
          // Check if there are more messages to load
          const { count } = await supabase
            .from('property_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', selectedConversation.id);
          
          setHasMoreMessages(count > PAGE_SIZE);
        } else {
          setMessages(rpcData || []);
          
          // Check if there are more messages to load
          const { count } = await supabase
            .from('property_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', selectedConversation.id);
          
          setHasMoreMessages(count > PAGE_SIZE);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "Could not load conversation messages",
        });
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessagesForSelectedConversation();
    
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload: { new: Message }) => {
          // Add the new message to the message list
          const newMessage = payload.new;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark message as read if we are the recipient
          if (newMessage.recipient_id === user?.id) {
            supabase.rpc('mark_conversation_messages_read', {
              p_conversation_id: selectedConversation.id
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedConversation, user?.id, toast, PAGE_SIZE]);

  // On message send: Optimistically add to UI, update cache
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    setSendingMessage(true);

    // Optimistic UI: add temp message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      recipient_id: selectedConversation.landlord_id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");

    try {
      const { data, error } = await supabase.rpc('add_message_to_conversation', {
        p_conversation_id: selectedConversation.id,
        p_sender_id: user.id,
        p_recipient_id: selectedConversation.landlord_id,
        p_message: optimisticMsg.message
      });

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, id: data || Date.now().toString() }
            : msg
        )
      );

      // Update cache
      const cacheKey = `messages-${selectedConversation.id}`;
      const cached = messagesCache.get(cacheKey);
      if (cached) {
        messagesCache.set(cacheKey, {
          messages: [...cached.messages, { ...optimisticMsg, id: data || Date.now().toString() }],
          timestamp: Date.now()
        });
      }

    } catch (error: unknown) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Could not send your message",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };
  
  const refreshConversations = () => {
    if (refreshing) return;
    
    setRefreshing(true);
    fetchConversations();
  };

  const showChatArea = selectedConversation && (isMobileView || !isMobileView);
  const showConversationList = !selectedConversation || !isMobileView;

  // Optimize the render with a better loading indicator
  const renderLoadingUI = () => (
    <div className="w-full h-full flex flex-col">
      {/* Conversation list skeleton */}
      <div className="p-4 border-b border-white/10">
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
              <div className="h-3 w-40 bg-white/5 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (initialPageLoad) {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100]">
        <div className="animate-spin h-12 w-12 border-4 border-white/30 border-t-white rounded-full mb-4"></div>
        <div className="text-white font-medium text-lg">Loading chat...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="flex flex-col h-screen bg-black text-white pt-14">
        <main className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          {showConversationList && (
            <div className={`${isMobileView && selectedConversation ? 'hidden' : 'block'} w-full md:w-1/3 lg:w-1/4 bg-black text-white border-r border-white/10`}>
              {initialPageLoad ? (
                renderLoadingUI()
              ) : loadingConversation ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div>
                  <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Messages</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={refreshConversations}
                      disabled={refreshing}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {lastRefreshed && (
                    <div className="px-4 py-1 text-xs text-white/40 text-center">
                      Last updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
                    </div>
                  )}
                  
                  {loading && landlordGroups.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-white/30 rounded-full"></div>
                        <div className="h-2 w-2 bg-white/50 rounded-full"></div>
                        <div className="h-2 w-2 bg-white/70 rounded-full"></div>
                      </div>
                    </div>
                  ) : landlordGroups.length === 0 ? (
                    <div className="p-4 text-center text-white/60">
                      <MessageCircle className="h-12 w-12 mb-3 text-white/30" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">
                        Messages about properties you&apos;ve inquired about will appear here
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-8rem)]">
                      <div className="space-y-1 p-2">
                        {/* Landlord Groups */}
                        {landlordGroups.map((group) => (
                          <div key={group.landlord_id} className="mb-4">
                            {/* Properties under this landlord */}
                            <div className="ml-4 border-l border-white/10 pl-2">
                              {group.conversations.map((conversation) => (
                                <button
                                  key={conversation.id}
                                  className={cn(
                                    "w-full flex items-center p-3 rounded-md hover:bg-white/5 transition-colors text-left relative",
                                    selectedConversation?.id === conversation.id && "bg-white/10"
                                  )}
                                  onClick={() => handleConversationClick(conversation)}
                                >
                                  {/* Avatar - Always use text-based avatar */}
                                  <Avatar className="h-8 w-8 border border-white/10 mr-3">
                                    <AvatarFallback className="bg-blue-900 text-white">
                                      {conversation.property.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="font-medium truncate text-white">{conversation.property.name}</p>
                                    <p className="text-sm text-white/50 truncate">{conversation.last_message ? conversation.last_message.message : conversation.last_message_text || 'Start a conversation'}</p>
                                  </div>

                                  {/* Green Dot for New Messages */}
                                  {(conversation.unread_count ?? 0) > 0 && (
                                    <div className="absolute top-3 right-3 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat Area */}
          {showChatArea ? (
            <div className={`${isMobileView && !selectedConversation ? 'hidden' : 'block'} w-full md:w-2/3 lg:w-3/4 flex flex-col bg-black text-white`}>
              {loadingConversation ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center bg-black/80 backdrop-blur-sm">
                    {isMobileView && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mr-2 text-white hover:bg-white/10"
                        onClick={handleBackClick}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                        <span className="sr-only">Back</span>
                      </Button>
                    )}
                    
                    {selectedConversation && (
                      <div className="flex items-center">
                        {/* Replace Image with div for property avatar */}
                        <div className="h-10 w-10 rounded-md overflow-hidden mr-3 bg-blue-900 flex items-center justify-center text-white font-medium">
                          {selectedConversation.property.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-semibold">{selectedConversation.property.name}</h2>
                          <p className="text-xs text-white/60">
                            Landlord: {selectedConversation.landlord.full_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="flex-1 p-4 overflow-y-auto bg-zinc-900"
                    ref={messagesContainerRef}
                  >
                    {loading && messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse flex space-x-2">
                          <div className="h-3 w-3 bg-zinc-400 rounded-full"></div>
                          <div className="h-3 w-3 bg-zinc-400 rounded-full"></div>
                          <div className="h-3 w-3 bg-zinc-400 rounded-full"></div>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                        <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation with your landlord</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {hasMoreMessages && (
                          <div className="flex justify-center my-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadMoreMessages}
                              disabled={loading}
                              className="text-xs bg-white/5 hover:bg-white/10"
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "Load older messages"
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-start gap-2 max-w-[80%]",
                              message.sender_id === user?.id
                                ? "ml-auto flex-row-reverse"
                                : "mr-auto"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-4 py-2",
                                message.sender_id === user?.id 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-white/10 text-white"
                              )}
                            >
                              <p>{message.message}</p>
                              <div className={cn(
                                "text-xs mt-1 flex justify-end items-center gap-1",
                                message.sender_id === user?.id ? "text-blue-200/70" : "text-white/60"
                              )}>
                                <span>{formatMessageTime(message.created_at)}</span>
                                {message.sender_id === user?.id && message.is_read && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-black/80">
                    <Input
                      type="text"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                      disabled={sendingMessage}
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {sendingMessage ? (
                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex w-full md:w-2/3 lg:w-3/4 flex-col bg-black items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Your property messages</h3>
                <p className="text-white/60 mb-4">Select a conversation to start chatting</p>
                <p className="text-sm text-white/40">Messages about properties you&apos;ve inquired about will appear here</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}