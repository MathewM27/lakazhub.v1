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

// Define TTL for cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const PAGE_SIZE = 10; // Number of messages to load per page

  const [loadingConversation, setLoadingConversation] = useState(false);

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

  // Add a new loading state indicator specifically for initial page load
  const [initialPageLoad, setInitialPageLoad] = useState(true);
  
  // Add a state to track if we've prefetched data
  const [hasPrefetched, setHasPrefetched] = useState(false);

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
      
      // Get current session for auth token
      const { data: authSession } = await supabase.auth.getSession();
      if (!authSession.session) {
        throw new Error('No active session');
      }
      
      // First check if the property table has column 'image' or 'images'
      const { data: propertiesColumns, error: columnsError } = await supabase
        .from('properties')
        .select('*')
        .limit(1);
        
      if (columnsError) {
        throw columnsError;
      }
      
      // Determine the image column name from the first property
      const imageColumnName = propertiesColumns && propertiesColumns.length > 0 && 
        Object.prototype.hasOwnProperty.call(propertiesColumns[0], 'image') ? 'image' : 'images';
      
      // Use a more efficient query approach - get all data in one query
      // Dynamically construct the query based on the column name
      const { data, error } = await supabase
        .from('property_conversations')
        .select(`
          id,
          property_id,
          tenant_id,
          landlord_id,
          last_message_text,
          last_message_at,
          tenant_unread_count,
          messages,
          properties:property_id (id, name, ${imageColumnName}, location)
        `)
        .eq('tenant_id', user.id)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        setConversations([]);
        setLandlordGroups([]);
        setLoading(false);
        setRefreshing(false);
        setLastRefreshed(new Date());
        setInitialPageLoad(false);
        return;
      }
      
      // Get all unique landlord IDs for a single profile query
      const landlordIds: string[] = [...new Set((data as { landlord_id: string }[]).map((conv) => conv.landlord_id))];
      
      // Get landlord profiles in a single query
      const { data: landlordsData, error: landlordsError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo, user_role, email_address')
        .in('id', landlordIds);
      
      if (landlordsError) {
        throw landlordsError;
      }
      
      // Create lookup map for landlords
      const landlordsMap = landlordsData.reduce((acc: Record<string, Profile>, landlord: Profile) => {
        acc[landlord.id] = landlord;
        return acc;
      }, {});
      
      // Structure the conversations with all necessary data
      const conversationsWithExtras = data.map((conv: {
        id: string;
        property_id: string;
        tenant_id: string;
        landlord_id: string;
        last_message_text: string;
        last_message_at: string;
        tenant_unread_count: number;
        messages: Message[];
        properties?: { id: string; name: string; image?: string; images?: string[]; location?: string };
      }) => {
        const property = conv.properties || { 
          id: conv.property_id,
          name: 'Unknown Property',
          location: 'Unknown Location'
        };
        
        // Map the image property correctly based on which column exists
        if (property) {
          if (!property.image && Array.isArray(property['images'])) {
            property.image = property['images'][0] || undefined;
          } else if (!property.image && typeof property['images'] === 'string') {
            property.image = property['images'];
          }
        }
        
        const landlord = landlordsMap[conv.landlord_id] || {
          id: conv.landlord_id,
          full_name: 'Unknown Landlord'
        };
        
        // Get the last message
        let lastMessage = null;
        if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
          // Sort to get the latest message (may already be sorted, but just in case)
          const sortedMessages = [...conv.messages].sort((a: Message, b: Message) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          lastMessage = sortedMessages[0];
        }
        
        return {
          ...conv,
          property,
          landlord,
          tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
          last_message: lastMessage,
          last_message_time: lastMessage ? formatMessageTime(lastMessage.created_at) : 
                            conv.last_message_at ? formatMessageTime(conv.last_message_at) : '',
          unread_count: conv.tenant_unread_count || 0,
          messages: conv.messages || []
        };
      });
      
      // Update cache
      conversationsCache.set(cacheKey, { 
        data: conversationsWithExtras, 
        timestamp: now 
      });
      
      setConversations(conversationsWithExtras);
      groupConversationsByLandlord(conversationsWithExtras);
    } catch (error: unknown) {
      // Log more detailed error information
      if (error && typeof error === 'object' && 'message' in error) {
      }
      
      // Try a fallback approach with simpler queries
      try {
        // First, get the conversations
        const { data: conversationsData } = await supabase
          .from('property_conversations')
          .select('id, property_id, tenant_id, landlord_id, last_message_text, last_message_at, tenant_unread_count, messages')
          .eq('tenant_id', user.id)
          .order('last_message_at', { ascending: false });
          
        if (!conversationsData || conversationsData.length === 0) {
          setConversations([]);
          setLandlordGroups([]);
          return;
        }
        
        // Then, get the properties separately
        const propertyIds: string[] = [...new Set((conversationsData as { property_id: string }[]).map((conv) => conv.property_id))];
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds);
        
        // Create properties map
        const propertiesMap: Record<string, any> = {};
        if (propertiesData) {
          propertiesData.forEach((property: any) => {
            propertiesMap[property.id] = property;
          });
        }
        
        // Get landlord profiles
        const landlordIds: string[] = [...new Set((conversationsData as { landlord_id: string }[]).map((conv) => conv.landlord_id))];
        const { data: landlordsData } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo, user_role')
          .in('id', landlordIds);
          
        // Create landlords map
        const landlordsMap: Record<string, any> = {};
        if (landlordsData) {
          landlordsData.forEach((landlord: any) => {
            landlordsMap[landlord.id] = landlord;
          });
        }
        
        // Combine data
        const conversationsWithExtras = conversationsData.map((conv: any) => {
          const property = propertiesMap[conv.property_id] || { 
            id: conv.property_id,
            name: 'Unknown Property',
            location: 'Unknown Location'
          };
          
          const landlord = landlordsMap[conv.landlord_id] || {
            id: conv.landlord_id,
            full_name: 'Unknown Landlord'
          };
          
          // Handle image property
          if (property) {
            property.image = property.image || property.images || null;
          }
          
          // Get the last message
          let lastMessage = null;
          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            const sortedMessages = [...conv.messages].sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            lastMessage = sortedMessages[0];
          }
          
          return {
            ...conv,
            property,
            landlord,
            tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
            last_message: lastMessage,
            last_message_time: lastMessage ? formatMessageTime(lastMessage.created_at) : 
                              conv.last_message_at ? formatMessageTime(conv.last_message_at) : '',
            unread_count: conv.tenant_unread_count || 0,
            messages: conv.messages || []
          };
        });
        
        setConversations(conversationsWithExtras);
        groupConversationsByLandlord(conversationsWithExtras);
      } catch (error: unknown) {
        
        toast({
          title: "Error loading conversations",
          description: error instanceof Error ? error.message : "Could not load your conversations",
        });
      }
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
  const groupConversationsByLandlord = (convs: ConversationWithExtras[]) => {
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
  };

  // Optimize subscription handling
  useEffect(() => {
    if (!user?.id) return;
    
    // Set up a more efficient subscription
    const conversationsSubscription = supabase
      .channel('property-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_conversations',
          filter: `tenant_id=eq.${user.id}`
        },
        (_payload: { new: ConversationWithExtras; old: ConversationWithExtras; eventType: string }) => {
          // Invalidate cache and refetch data on any change
          const cacheKey = `conversations-${user.id}`;
          conversationsCache.delete(cacheKey);
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [user?.id, fetchConversations]);

  // Simplify message fetching when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    
    // Reset pagination when conversation changes
    setCurrentPage(0);
    setHasMoreMessages(false);
    setLoading(true);
    
    // Messages are already in the conversation object, so use them directly
    if (selectedConversation.messages && Array.isArray(selectedConversation.messages)) {
      setMessages(selectedConversation.messages);
      setHasMoreMessages(false);
      
      // Mark messages as read
      supabase.rpc('mark_conversation_messages_read', {
        p_conversation_id: selectedConversation.id
      });
      
      setLoading(false);
    } else {
      // Fallback if messages aren't in the conversation object
      const fetchMessages = async () => {
        try {
          const { data, error } = await supabase
            .from('property_conversations')
            .select('messages')
            .eq('id', selectedConversation.id)
            .single();
            
          if (error) throw error;
          
          if (data && data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages);
            
            // Mark messages as read
            await supabase.rpc('mark_conversation_messages_read', {
              p_conversation_id: selectedConversation.id
            });
          } else {
            setMessages([]);
          }
        } catch (error: unknown) {
          toast({
            title: "Error loading messages",
            description: error instanceof Error ? error.message : "Could not load messages",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchMessages();
    }
    
    // Subscribe to conversation updates
    const messagesSubscription = supabase
      .channel(`conversation-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_conversations',
          filter: `id=eq.${selectedConversation.id}`
        },
        (payload: { new: { messages: Message[]; tenant_unread_count: number }; old: unknown; eventType: string }) => {
          const updatedConversation = payload.new;
          
          // Update messages if the messages array has changed
          if (updatedConversation.messages && Array.isArray(updatedConversation.messages)) {
            setMessages(updatedConversation.messages);
            
            // Mark as read if we are the recipient
            if (updatedConversation.tenant_unread_count > 0) {
              supabase.rpc('mark_conversation_messages_read', {
                p_conversation_id: selectedConversation.id
              });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedConversation, user?.id, toast]);

  // Function to load more messages
  const loadMoreMessages = async () => {
    if (!selectedConversation || !hasMoreMessages || loadingMoreMessages) return;
    
    setLoadingMoreMessages(true);
    
    try {
      const nextPage = currentPage + 1;
      const startRange = nextPage * PAGE_SIZE;
      const endRange = startRange + PAGE_SIZE - 1;
      
      const { data, error, count } = await supabase
        .from('property_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: false })
        .range(startRange, endRange);
        
      if (error) throw error;
      
      // Check if there are more messages to load after this batch
      setHasMoreMessages(count ? count > endRange + 1 : false);
      
      // Add older messages to the beginning of the array (reverse to maintain chronological order)
      const olderMessages = [...(data || [])].reverse();
      setMessages(prev => [...olderMessages, ...prev]);
      
      // Update current page
      setCurrentPage(nextPage);
    } catch (error) {
      toast({
        title: "Error loading more messages",
        description: error instanceof Error ? error.message : "Could not load older messages",
      });
    } finally {
      setLoadingMoreMessages(false);
    }
  };
  
  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current && currentPage === 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentPage]);

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      
      // If within last 7 days, show day name
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      
      // Otherwise show date
      return format(date, 'MMM d');
    } catch {
      return 'Unknown';
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;
    
    setSendingMessage(true);
    
    try {
      // Send the message using the add_message_to_conversation function
      const { data, error } = await supabase.rpc('add_message_to_conversation', {
        p_conversation_id: selectedConversation.id,
        p_sender_id: user.id,
        p_recipient_id: selectedConversation.landlord_id,
        p_message: newMessage.trim()
      });
      
      if (error) throw error;
      
      // Add message to UI immediately without waiting for subscription
      const newMessageObj: Message = {
        id: data || Date.now().toString(),
        sender_id: user.id,
        recipient_id: selectedConversation.landlord_id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Update messages state immediately
      setMessages(prev => [...prev, newMessageObj]);
      
      // Clear the input
      setNewMessage("");
      
    } catch (error: unknown) {
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
    // The useEffect with user?.id dependency will handle the actual refresh
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
                      <span className="text-xs">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
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
                        {/* Load More button */}
                        {hasMoreMessages && (
                          <div className="flex justify-center my-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadMoreMessages}
                              disabled={loadingMoreMessages}
                              className="text-xs"
                            >
                              {loadingMoreMessages ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "Load More"
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