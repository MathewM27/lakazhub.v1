"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Home, Send, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/lib/utils";
import Navigation from "../components/navigation/Navbar";
import { supabase } from "../utils/supabase/client";
import { useToast } from "../hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";

// Import types from our centralized type definitions
import {
  Conversation,
  ConversationWithExtras,
  LandlordGroup,
  Message,
  Property,
  Profile,
  RealtimePayload
} from '@/utils/types/chat';

// We're now using the types from our centralized type definitions

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

  // Fetch all conversations
  useEffect(() => {
    if (!user?.id) {
      console.log('[CHAT_PAGE] No user ID available, skipping conversation fetch');
      return;
    }
    console.log('[CHAT_PAGE] User authenticated:', user);
    
    const fetchConversations = async () => {
      setLoading(true);
      console.log('[CHAT_PAGE] Fetching conversations for user:', user?.id);
      
      try {
        // Step 1: Get all conversations for the current tenant
        console.log('[CHAT_PAGE] User ID for query:', user.id);
        
        // Get current session for auth token
        const { data: authSession } = await supabase.auth.getSession();
        if (!authSession.session) {
          console.error('[CHAT_PAGE] No active session when fetching conversations');
          throw new Error('No active session');
        }
        
        // Use direct API approach with proper authentication
        const authHeaders = {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${authSession.session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        };
        
        // First, try direct API call
        // Include messages in the query to get them directly - messages is a JSONB array in the table
        const conversationsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/property_conversations?tenant_id=eq.${user.id}&select=*,messages&order=updated_at.desc`;
        
        console.log('[CHAT_PAGE] Fetching conversations with URL:', conversationsUrl);
        
        let conversationsData: any[] = [];
        let conversationsError = null;
        
        try {
          const response = await fetch(conversationsUrl, {
            method: 'GET',
            headers: authHeaders
          });
          
          if (response.ok) {
            conversationsData = await response.json();
            console.log('[CHAT_PAGE] Conversations fetched successfully via direct API:', conversationsData.length);
          } else {
            console.error('[CHAT_PAGE] Direct API conversations fetch failed:', response.status, await response.text());
            
            // Fall back to regular supabase query
            // Note: messages is a JSONB array in the property_conversations table, not a separate table
            const { data, error } = await supabase
              .from('property_conversations')
              .select('*')
              .eq('tenant_id', user.id)
              .order('updated_at', { ascending: false });
              
            if (error) {
              console.error('[CHAT_PAGE] Fallback conversations query failed:', error);
              conversationsError = error;
            } else {
              conversationsData = data || [];
              console.log('[CHAT_PAGE] Conversations fetched via fallback:', conversationsData.length);
            }
          }
        } catch (error) {
          console.error('[CHAT_PAGE] Exception fetching conversations:', error);
          conversationsError = error as any;
        }
        
        if (conversationsError) throw conversationsError;
        
        if (!conversationsData || conversationsData.length === 0) {
          console.log('[CHAT_PAGE] No conversations found for user:', user.id);
          setConversations([]);
          setLandlordGroups([]);
          setLoading(false);
          setRefreshing(false);
          setLastRefreshed(new Date());
          return;
        }
        
        console.log('[CHAT_PAGE] Found conversations:', conversationsData);
        
        // Step 2: Get all property IDs from conversations
        const propertyIds = [...new Set(conversationsData.map((conv: any) => conv.property_id))];
        console.log('[CHAT_PAGE] Property IDs:', propertyIds);
        
        // Step 3: Get all landlord IDs from conversations
        const landlordIds = [...new Set(conversationsData.map((conv: any) => conv.landlord_id))];
        console.log('[CHAT_PAGE] Landlord IDs:', landlordIds);
        
        // Step 4: Fetch all properties in one query
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds);
          
        if (propertiesError) throw propertiesError;
        
        // Step 5: Fetch all landlord profiles in one query
        console.log('[CHAT_PAGE] Fetching landlord profiles for IDs:', landlordIds);
        
        // Get current session for auth token - reuse the auth session from above
        if (!authSession.session) {
          console.error('[CHAT_PAGE] No active session when fetching landlord profiles');
          throw new Error('No active session');
        }
        
        // Use direct API call with proper headers to avoid 406 errors
        const profileHeaders = {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${authSession.session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        };
        
        // Build the query string for the IN condition - using the proper format for the 'in' operator
        const profilesUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id,full_name,profile_photo,user_role,email_address&id=in.(${landlordIds.join(',')})`;
        
        console.log('[CHAT_PAGE] Fetching profiles with URL:', profilesUrl);
        
        let landlordsData: any[] = [];
        try {
          const response = await fetch(profilesUrl, {
            method: 'GET',
            headers: profileHeaders
          });
          
          if (response.ok) {
            landlordsData = await response.json();
            console.log('[CHAT_PAGE] Landlord profiles fetched successfully:', landlordsData.length);
          } else {
            console.error('[CHAT_PAGE] Error fetching landlord profiles:', response.status, await response.text());
            // Fall back to regular supabase query as a backup
            const { data, error } = await supabase
              .from('profiles')
              .select('id, full_name, profile_photo, user_role, email_address')
              .in('id', landlordIds);
              
            if (error) {
              console.error('[CHAT_PAGE] Fallback profile query failed:', error);
              throw error;
            }
            
            landlordsData = data || [];
          }
        } catch (error) {
          console.error('[CHAT_PAGE] Exception fetching landlord profiles:', error);
          throw error;
        }
        
        // Create lookup maps for faster access
        const propertiesMap: Record<string, Property> = propertiesData.reduce((acc: Record<string, Property>, property: Property) => {
          acc[property.id] = property;
          return acc;
        }, {});
        
        const landlordsMap: Record<string, Profile> = landlordsData.reduce((acc: Record<string, Profile>, landlord: Profile) => {
          acc[landlord.id] = landlord;
          return acc;
        }, {});
        
        // Step 6: Combine all data
        // Use Promise.all with async map function
        const conversationsWithExtras = await Promise.all(conversationsData.map(async (conv: any) => {
          const property = propertiesMap[conv.property_id] || { 
            id: conv.property_id,
            name: 'Unknown Property',
            location: 'Unknown Location'
          };
          
          const landlord = landlordsMap[conv.landlord_id] || { 
            id: conv.landlord_id,
            full_name: 'Unknown Landlord'
          };
          
          // Check if we have messages directly in the conversation object
          console.log('[CHAT_PAGE] Processing conversation:', conv.id);
          
          // Get messages for this conversation
          console.log('[CHAT_PAGE] Fetching messages for conversation:', conv.id);
          
          // Check if conversation has messages directly in the object
          if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
            console.log('[CHAT_PAGE] Using messages from conversation object:', conv.messages.length);
            // Sort messages by created_at to get the latest
            const sortedMessages = [...conv.messages].sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            
            // Take the latest message
            const lastMessage = sortedMessages[0];
            console.log('[CHAT_PAGE] Using latest message from conversation object:', lastMessage);
            
            // Return the conversation with the message data
            return {
              ...conv,
              property,
              landlord,
              tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
              last_message: lastMessage,
              last_message_time: lastMessage.created_at 
                ? formatMessageTime(lastMessage.created_at as string) 
                : conv.last_message_at 
                  ? formatMessageTime(conv.last_message_at as string) 
                  : '',
              unread_count: conv.tenant_unread_count || 0,
              messages: conv.messages || [] // Include the messages array
            };
          }
          
          // If no messages in conversation object, log it - we shouldn't need to fetch from a separate table
          // since messages are stored directly in the conversation object as a JSONB array
          console.log('[CHAT_PAGE] No messages found in conversation JSONB array');
          
          // Try regular supabase query first
          try {
            const { data } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (data && data.length > 0) {
              console.log('[CHAT_PAGE] Messages fetched via supabase query:', data.length);
              return data;
            }
            
            console.log('[CHAT_PAGE] No messages found via supabase query, trying direct API');
            
            // If no results, try direct API approach
            // Use the existing auth session
            if (!authSession.session) {
              console.error('[CHAT_PAGE] No active session when fetching messages');
              return [];
            }
            
            const messageAuthHeaders = {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
              'Authorization': `Bearer ${authSession.session.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Prefer': 'return=representation'
            };
            
            const messagesUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conv.id}&order=created_at.desc&limit=1`;
            
            const response = await fetch(messagesUrl, {
              method: 'GET',
              headers: authHeaders
            });
            
            if (response.ok) {
              const apiData = await response.json();
              console.log('[CHAT_PAGE] Messages fetched via direct API:', apiData.length);
              return apiData;
            }
            
            console.error('[CHAT_PAGE] Direct API message fetch failed:', response.status);
            return [];
          } catch (error) {
            console.error('[CHAT_PAGE] Error fetching messages:', error);
            return [];
          }
          
          // At this point, we've tried all approaches to get messages and none worked
          console.log('[CHAT_PAGE] No messages found for conversation after all attempts:', conv.id);
          
          // Create a function to safely format message time
          const getFormattedTime = () => {
            if (conv.last_message_at) {
              return formatMessageTime(conv.last_message_at as string);
            }
            return '';
          };
          
          // Log the entire conversation object to debug
          console.log('[CHAT_PAGE] Full conversation object:', JSON.stringify(conv, null, 2));
          
          return {
            ...conv,
            property,
            landlord,
            tenant: { id: user.id, full_name: user.user_metadata?.full_name || 'Tenant', user_role: 'tenant' },
            last_message: null,
            last_message_time: getFormattedTime(),
            unread_count: conv.tenant_unread_count || 0,
            messages: [] // Empty array since we couldn't find any messages
          };
        }));
        
        setConversations(conversationsWithExtras);
        
        // Group conversations by landlord
        groupConversationsByLandlord(conversationsWithExtras);
      } catch (error: any) {
        console.error('[CHAT_PAGE] Error loading conversations:', error);
        toast({
          title: "Error loading conversations",
          description: error.message || "Could not load your conversations",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLastRefreshed(new Date());
        console.log('[CHAT_PAGE] Final state - conversations:', conversations);
        console.log('[CHAT_PAGE] Final state - landlord groups:', landlordGroups);
      }
    };
    
    fetchConversations();
    
    // Subscribe to updates in conversations
    const conversationsSubscription = supabase
      .channel('property-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_conversations',
          filter: `tenant_id=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(conversationsSubscription);
    };
  }, [user?.id, toast]);

  // Group conversations by landlord
  const groupConversationsByLandlord = (convs: ConversationWithExtras[]) => {
    const groups: Record<string, LandlordGroup> = {};
    
    convs.forEach(conv => {
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

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    
    // Reset pagination when conversation changes
    setCurrentPage(0);
    setHasMoreMessages(false);
    
    const fetchMessages = async () => {
      setLoading(true);
      
      try {
        // Get the conversation with its messages array
        const { data, error } = await supabase
          .from('property_conversations')
          .select('*')
          .eq('id', selectedConversation.id)
          .single();
          
        if (error) throw error;
        
        if (data && data.messages && Array.isArray(data.messages)) {
          // Set messages from the JSONB array
          setMessages(data.messages);
          
          // Check if there are more messages to load (for pagination if needed)
          setHasMoreMessages(false); // No pagination needed with the array approach
          
          // Mark messages as read
          await supabase.rpc('mark_conversation_messages_read', {
            p_conversation_id: selectedConversation.id
          });
        } else {
          setMessages([]);
        }
      } catch (error: any) {
        toast({
          title: "Error loading messages",
          description: error.message || "Could not load messages",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to conversation updates
    const messagesSubscription = supabase
      .channel(`property-conversations-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_conversations',
          filter: `id=eq.${selectedConversation.id}`
        },
        (payload: RealtimePayload<Conversation>) => {
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
    } catch (error: any) {
      toast({
        title: "Error loading more messages",
        description: error.message || "Could not load older messages",
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
    } catch (e) {
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
      
      // The subscription will handle any further updates if needed
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Could not send your message",
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

  return (
    <>
      <Navigation />
      <div className="flex flex-col h-screen bg-black text-white pt-14">
        <main className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          {showConversationList && (
            <div className={`${isMobileView && selectedConversation ? 'hidden' : 'block'} w-full md:w-1/3 lg:w-1/4 bg-black text-white border-r border-white/10`}>
              {loadingConversation ? (
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
                        Messages about properties you've inquired about will appear here
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
                                  {/* Avatar Image */}
                                  <Avatar className="h-8 w-8 border border-white/10 mr-3">
                                    {conversation.property.image ? (
                                      <AvatarImage src={conversation.property.image} alt={conversation.property.name} />
                                    ) : (
                                      <AvatarFallback className="bg-blue-900 text-white">
                                        {conversation.property.name.charAt(0)}
                                      </AvatarFallback>
                                    )}
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
                        <div className="relative h-10 w-10 rounded-md overflow-hidden mr-3">
                          {selectedConversation.property.image ? (
                            <Image
                              src={selectedConversation.property.image}
                              alt={selectedConversation.property.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <Home className="w-6 h-6 text-white/40" />
                            </div>
                          )}
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
                <p className="text-sm text-white/40">Messages about properties you've inquired about will appear here</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}