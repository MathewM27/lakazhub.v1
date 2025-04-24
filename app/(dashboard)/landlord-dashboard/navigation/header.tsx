'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
    Home, 
    MessageCircle, 
    Bell, 
    User,
    Menu,
    ChevronRight,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "../lib/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Replace static imports with dynamic imports
const ProfileModal = dynamic(() => import("./ProfileModal"), { ssr: false });
const NotificationsModal = dynamic(() => import("../components/modals/notification-modal"), { ssr: false });

import { format, formatDistanceToNow } from "date-fns";

// Add at the top of the file
declare global {
  interface Window {
    clearConversationFromCache?: (conversationId: string) => void;
    activateRealtime?: (duration: number) => void;
    readConversations?: Set<string>;
  }
}

// Define message notification type
interface MessageNotification {
  conversationId: string;
  propertyId: string;
  propertyName: string;
  senderName: string;
  message: string;
  time: string;
  isRead: boolean;
  senderInitial: string;
  messageCount: number;
  latestMessageId: string;
}

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // State for ProfileModal
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([]);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const messageSubscriptionRef = useRef<any>(null);

    // Add this new state for notifications
    const [notifications, setNotifications] = useState<Array<any>>([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Load user data
        async function loadUser() {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (!error && data.user) {
                    setUser(data.user);
                }
            } catch {
                // console.error('Error loading user in navbar:', err);
            }
        }
        
        loadUser();
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch unread messages and notifications
    const fetchUnreadMessagesAndNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Query for conversations with unread messages
            const { data: conversationsData, error: conversationsError } = await supabase
              .from('property_conversations')
              .select('*, properties(*)')
              .eq('landlord_id', user.id)
              .eq('is_archived', false)
              .gt('landlord_unread_count', 0)
              .order('last_message_at', { ascending: false });

            if (conversationsError) throw conversationsError;

            // Filter out conversations that have been marked as read globally
            let filteredConversations = conversationsData;
            if (window.readConversations && conversationsData) {
              filteredConversations = conversationsData.filter((conv: { id: string }) => 
                !window.readConversations?.has(conv.id)
              );
            }

            // Set unread count
            const unreadCount = filteredConversations ? 
              filteredConversations.reduce((sum: number, conv: { landlord_unread_count?: number }) => sum + (conv.landlord_unread_count || 0), 0) : 0;
            setUnreadMessagesCount(unreadCount);

            // If no unread messages, clear notifications and return
            if (!filteredConversations || filteredConversations.length === 0) {
              setMessageNotifications([]);
              return;
            }

            // Get tenant profiles for display names
            const tenantIds = [...new Set(filteredConversations.map((conv: { tenant_id: string }) => conv.tenant_id))];
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', tenantIds);

            // Create a map of tenant IDs to profiles for easy lookup
            const tenantProfiles: Record<string, { full_name?: string }> = {};
            if (profilesData) {
              profilesData.forEach((profile: { id: string; full_name?: string }) => {
                tenantProfiles[profile.id] = profile;
              });
            }

            // Create notification objects from conversations
            const notifications = filteredConversations.map((conv: {
              id: string;
              property_id: string;
              properties?: { name?: string };
              tenant_id: string;
              messages?: { message: string; created_at: string; id: string }[];
              landlord_unread_count?: number;
              created_at: string;
            }) => {
              const tenantProfile = tenantProfiles[conv.tenant_id] || {};
              const tenantName = tenantProfile?.full_name || 'Tenant';
              
              // Get the last message from the messages array
              const messages = conv.messages || [];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              
              // Safely access property name
              const propertyName = conv.properties && typeof conv.properties === 'object' && conv.properties.name 
                ? conv.properties.name 
                : 'Property';
              
              return {
                conversationId: conv.id,
                propertyId: conv.property_id,
                propertyName,
                senderName: tenantName,
                message: lastMessage ? lastMessage.message : 'No messages',
                time: formatMessageTime(lastMessage ? lastMessage.created_at : conv.created_at),
                isRead: false,
                senderInitial: tenantName.charAt(0).toUpperCase(),
                messageCount: conv.landlord_unread_count || 0,
                latestMessageId: lastMessage ? lastMessage.id : ''
              };
            }).sort((a: MessageNotification, b: MessageNotification) => {
              // Sort by time (newest first)
              return new Date(b.time).getTime() - new Date(a.time).getTime();
            }).slice(0, 10); // Limit to 10 most recent conversations
            
            setMessageNotifications(notifications);
        } catch {
            // console.error('Error fetching message notifications:', error);
        }
    }, [user?.id]);

    // Handle clicking on a message notification
    const handleMessageNotificationClick = async (notification: MessageNotification) => {
        try {
            // Get property details
            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .select('*')
                .eq('id', notification.propertyId)
                .single();
                
            if (propertyError) throw propertyError;
            
            // Set the selected property and conversation ID
            setSelectedProperty(propertyData);
            setSelectedConversationId(notification.conversationId);
            
            // Open the notification modal
            setNotificationModalOpen(true);
        } catch {
            // console.error('Error handling notification click:', error);
        }
    };

    // Set up real-time subscription for new messages
    useEffect(() => {
        if (!user?.id) return;

        // Initial fetch of unread messages
        fetchUnreadMessagesAndNotifications();

        // Set up real-time subscription for conversation updates
        const conversationUpdateSubscription = supabase
          .channel('header_conversations_update')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'property_conversations',
            filter: `landlord_id=eq.${user.id}`,
          }, (payload: { new: unknown }) => {
            const updatedConversation = (payload as { new: { landlord_unread_count: number } }).new;
            
            // Only update if there are unread messages
            if (updatedConversation.landlord_unread_count > 0) {
              fetchUnreadMessagesAndNotifications();
            }
          })
          .subscribe();
          
        // Listen for the custom event when messages are marked as read in other components
        const handleMessagesRead = () => {
          // Refresh notifications to update the UI
          fetchUnreadMessagesAndNotifications();
        };
        
        // Add event listener for the custom event
        window.addEventListener('messagesMarkedAsRead', handleMessagesRead as EventListener);
          
        messageSubscriptionRef.current = conversationUpdateSubscription;
        
        return () => {
          // Properly remove the channel from Supabase
          supabase.removeChannel(conversationUpdateSubscription);
          window.removeEventListener('messagesMarkedAsRead', handleMessagesRead as EventListener);
        }
    }, [user?.id, fetchUnreadMessagesAndNotifications]);

    // Call this once when the component mounts to fix any sync issues
    useEffect(() => {
        if (user?.id) {
            // Don't reset all unread messages on component mount
            // This was causing notifications to disappear without being viewed
            // Instead, just fetch the current state
            fetchUnreadMessagesAndNotifications();
        }
    }, [user?.id, fetchUnreadMessagesAndNotifications]);

    // Format message time
    const formatMessageTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();

            // If today, show time
            if (date.toDateString() === now.toDateString()) {
                return format(date, "h:mm a");
            }

            // If within last 7 days, show day name
            const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 7) {
                return formatDistanceToNow(date, { addSuffix: true });
            }

            // Otherwise show date
            return format(date, "MMM d");
        } catch {
            return "Unknown";
        }
    };

    // Mark all messages as read
    const markAllMessagesAsRead = async () => {
        try {
            if (messageNotifications.length === 0) return;
            
            // Get IDs of unread messages
            const unreadMessageIds = messageNotifications
                .filter(msg => !msg.isRead)
                .map(msg => msg.latestMessageId);
                
            if (unreadMessageIds.length === 0) return;
            
            // Update messages in database
            await supabase
                .from('property_messages')
                .update({ is_read: true })
                .in('id', unreadMessageIds);
                
            // Update local state
            setMessageNotifications(prev => 
                prev.map(msg => ({ ...msg, isRead: true }))
            );
            
            // Reset unread count
            setUnreadMessagesCount(0);
        } catch {
            // console.error('Error marking messages as read:', error);
        }
    };

    // Add this function to mark all notifications as read
    const markAllNotificationsAsRead = async () => {
        try {
            // This is where you would connect to your API to mark notifications as read
            // For now, we'll just reset the count in the UI
            setUnreadNotificationsCount(0);
            
            // Update notification items to show as read
            setNotifications(prev => 
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            
            // TODO: Implement backend call to mark notifications as read
            // Example:
            // await supabase
            //   .from('notifications')
            //   .update({ is_read: true })
            //   .eq('recipient_id', user?.id);
            
        } catch {
            // console.error('Error marking notifications as read:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Clear all PKCE/session storage and Supabase cookies
            if (typeof window !== "undefined") {
                sessionStorage.clear();
                localStorage.clear();
                document.cookie.split(";").forEach(cookie => {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
            }
            window.location.href = process.env.NEXT_PUBLIC_SITE_URL || 'https://lakazhub.com'; 
        } catch {
            // console.error('Error logging out:', err);
        }
    };

    return (
        <>
            <nav 
                className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 opacity-0 -translate-y-2 animate-navFadeIn ${
                    isScrolled 
                        ? "bg-black/90 backdrop-blur-md shadow-md border-b border-white/10" 
                        : "bg-transparent border-b border-white/20"
                }`}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
                    <Link href="/" className="group flex items-center">
                        <span className="text-2xl font-bold tracking-tight transition-colors text-white">
                            Lakaz<span className="opacity-70">Hub</span>
                        </span>
                        <div 
                            className="h-1 w-0 bg-white/30 group-hover:bg-white/50 transition-all duration-700 ml-1 mt-1 rounded-full animate-expandWidth"
                        />
                    </Link>

                    {/* Desktop navigation */}
                    <div className="hidden items-center space-x-1 md:flex">
                        <Link 
                            href="/" 
                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-300 text-white/90 hover:text-white"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            <span>Home</span>
                        </Link>

                        {/* Messages Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 text-white/90 hover:text-white"
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    <span>Messages</span>
                                    {unreadMessagesCount > 0 && (
                                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-80 bg-black/95 backdrop-blur-md border border-white/20 text-white rounded-xl shadow-xl"
                            >
                                <DropdownMenuLabel className="font-normal border-b border-white/10 bg-black/80">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-white">Messages</p>
                                            {unreadMessagesCount > 0 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-xs text-white/70 hover:text-white hover:bg-white/10"
                                                    onClick={markAllMessagesAsRead}
                                                >
                                                    Mark all as read
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/60">
                                            {messageNotifications.length > 0 
                                                ? `You have ${unreadMessagesCount} unread messages` 
                                                : "No messages"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                
                                <ScrollArea className="h-[300px]">
                                    {messageNotifications.length > 0 ? (
                                        messageNotifications.map((notification) => (
                                            <DropdownMenuItem 
                                                key={notification.conversationId} 
                                                className={`cursor-pointer px-4 py-3 hover:bg-white/5 border-b border-white/5 ${!notification.isRead ? 'bg-white/5' : ''}`}
                                                onClick={() => handleMessageNotificationClick(notification)}
                                            >
                                                <div className="flex items-start space-x-3 w-full">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                            {notification.senderInitial}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-sm font-medium truncate text-white">
                                                                {notification.senderName}
                                                            </p>
                                                            <span className="text-xs text-white/50 flex-shrink-0">{notification.time}</span>
                                                        </div>
                                                        <p className="text-xs text-white/70 font-medium mt-0.5">
                                                            {notification.propertyName}
                                                            {notification.messageCount > 1 && (
                                                                <span className="ml-1 text-white/50">
                                                                    ({notification.messageCount} messages)
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-white/80 line-clamp-2 mt-1">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-white/50 text-sm py-8">
                                            No messages
                                        </div>
                                    )}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Notifications Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 text-white/90 hover:text-white"
                                >
                                    <Bell className="mr-2 h-4 w-4" />
                                    <span>Notifications</span>
                                    {unreadNotificationsCount > 0 && (
                                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-80 bg-black/95 backdrop-blur-md border border-white/20 text-white rounded-xl shadow-xl"
                            >
                                <DropdownMenuLabel className="font-normal border-b border-white/10 bg-black/80">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-white">Notifications</p>
                                            {unreadNotificationsCount > 0 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-xs text-white/70 hover:text-white hover:bg-white/10"
                                                    onClick={markAllNotificationsAsRead}
                                                >
                                                    Mark all as read
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/60">
                                            {unreadNotificationsCount > 0 
                                                ? `You have ${unreadNotificationsCount} unread notifications` 
                                                : "No notifications"}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                
                                <ScrollArea className="h-[300px]">
                                    <div className="flex items-center justify-center h-full text-white/50 text-sm py-8">
                                        No notifications
                                    </div>
                                </ScrollArea>
                                
                                {notifications.length > 0 && (
                                    <div className="p-2 border-t border-white/10">
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs text-white/80 hover:text-white hover:bg-white/10"
                                        >
                                            View all notifications
                                        </Button>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                     {/* Mobile menu button */}
                     <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-white hover:bg-white/10"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent 
                                side="top" 
                                className="w-full bg-black/95 backdrop-blur-xl border-b border-white/20 text-white pt-16"
                            >
                                <SheetHeader className="border-b border-white/10 pb-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div 
                                            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                                            onClick={() => setIsProfileModalOpen(true)}
                                        >
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-white/70 hover:text-white hover:bg-white/10"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                    <SheetTitle className="text-white">Menu</SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[40vh]">
                                    <nav className="flex flex-col space-y-1">
                                        <Link 
                                            href="/" 
                                            className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200"
                                        >
                                            <div className="flex items-center">
                                                <Home className="mr-3 h-5 w-5 text-white/70" />
                                                <span>Home</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-white/50" />
                                        </Link>
                                        <Link 
                                            href="/chat" 
                                            className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200"
                                        >
                                            <div className="flex items-center">
                                                <MessageCircle className="mr-3 h-5 w-5 text-white/70" />
                                                <span>Messages</span>
                                            </div>
                                            <div className="flex items-center">
                                                {unreadMessagesCount > 0 && (
                                                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-white/50" />
                                            </div>
                                        </Link>
                                        <Link 
                                            href="/notifications" 
                                            className="flex items-center justify-between px-2 py-3 hover:bg-white/10 rounded-md transition-all duration-200"
                                        >
                                            <div className="flex items-center">
                                                <Bell className="mr-3 h-5 w-5 text-white/70" />
                                                <span>Notifications</span>
                                            </div>
                                            <div className="flex items-center">
                                                {unreadNotificationsCount > 0 && (
                                                    <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse mr-2"></div>
                                                )}
                                                <ChevronRight className="h-4 w-4 text-white/50" />
                                            </div>
                                        </Link>
                                    </nav>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* User avatar dropdown - only visible on desktop */}
                    <div className="hidden md:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <User className="h-4 w-4 text-white" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-56 bg-black/95 backdrop-blur-md border border-white/20  rounded-xl shadow-xl"
                            >
                                <div className="px-4 py-3 border-b border-white/10">
                                    <p className="text-sm font-medium">My Account</p>
                                    <p className="text-xs text-white/60 truncate mt-1">
                                        {user?.email || 'Sign in to access your account'}
                                    </p>
                                </div>
                                <DropdownMenuItem 
                                    onClick={() => setIsProfileModalOpen(true)}
                                    className="text-white hover:text-black hover:bg-white  cursor-pointer px-4 py-2.5 transition-colors"
                                >
                                    Profile Settings
                                </DropdownMenuItem>
                                {/* 
                                <DropdownMenuItem 
                                    className="text-white hover:text-black hover:bg-white cursor-pointer px-4 py-2.5 transition-colors"
                                >
                                    FAQ & Help
                                </DropdownMenuItem>
                                */}
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem 
                                    className="text-white hover:text-black  cursor-pointer px-4 py-2.5 transition-colors" 
                                    onClick={handleLogout}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>
            
            {/* Profile Modal */}
            <ProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                user={user} 
            />
            
            {/* Notification Modal for property-specific messages */}
            <NotificationsModal 
                open={notificationModalOpen} 
                onOpenChangeAction={(open) => {
                    setNotificationModalOpen(open);
                    
                    // When modal is closed, refresh notifications to clear any that were read
                    if (!open) {
                        // Clear the selected property and conversation
                        setSelectedProperty(null);
                        setSelectedConversationId(null);
                        
                        // Refresh notifications to update the UI
                        fetchUnreadMessagesAndNotifications();
                    } else if (open && selectedConversationId) {
                        // When modal is opened with a conversation, mark those messages as read in the UI
                        setMessageNotifications(prev => 
                            prev.filter(item => item.conversationId !== selectedConversationId)
                        );
                        
                        // Update the unread count
                        const conversationMessages = messageNotifications.find(
                            item => item.conversationId === selectedConversationId
                        );
                        
                        if (conversationMessages) {
                            setUnreadMessagesCount(prev => Math.max(0, prev - conversationMessages.messageCount));
                        }
                    }
                }}
                property={selectedProperty}
                initialConversationId={selectedConversationId || undefined}
            />
        </>
    );
};

export default Header;
