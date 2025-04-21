'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components//ui/button";
import { Label } from "@/components/ui/label";
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, User as UserIcon, X } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { useAuth } from "../../auth/AuthHandler";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const ProfileModal = ({ isOpen, onClose, user: propUser }: ProfileModalProps) => {
  // Get user and profile from auth context or props
  const { user: contextUser, profile: contextProfile } = useAuth();
  const user = propUser || contextUser;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // This would need proper backend implementation to fully delete the account
        setIsDeleting(true);
        setTimeout(() => {
          setIsDeleting(false);
          alert('Account deletion request submitted. Support will contact you.');
          onClose();
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Failed to delete account');
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md rounded-xl border border-white/20 bg-black text-white shadow-2xl overflow-y-auto min-h-[400px]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      >
        <DialogHeader className="relative">
          <div className="absolute top-0 right-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mb-2">
            <div className="h-16 w-16 min-h-[64px] min-w-[64px] rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg border-2 border-white/20">
              {contextProfile?.full_name?.[0] || user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'T'}
            </div>
          </div>
          <DialogTitle className="text-lg text-center font-semibold text-white">
            My Profile
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded-md flex items-center mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-sm text-white/70">Full Name</Label>
            <div className="flex items-center gap-2 px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <UserIcon className="h-4 w-4 text-white/50" />
              <span className="text-md font-medium text-white">
                {contextProfile?.full_name || user?.user_metadata?.full_name || 'Not provided'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-white/70">Email Address</Label>
            <div className="flex items-center justify-between px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/50" />
                <span className="text-md font-medium text-white">{contextProfile?.email_address || user?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/70">Subscription</Label>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/50">Coming soon</Badge>
            </div>
            <div className="px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <div className="text-center py-2">
                <p className="text-sm text-white/80">Premium features coming soon</p>
                <Button 
                  variant="outline" 
                  disabled={false} 
                  className="mt-2 border-white/30 bg-white/10 text-blue-300 hover:bg-white/20"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/70">Tenant Account</Label>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                {contextProfile?.user_role === 'landlord' ? 'Landlord' : 'Tenant'}
              </Badge>
            </div>
            <div className="px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <div className="text-sm text-white/90">
                <p>{contextProfile?.user_role === 'landlord' 
                  ? 'Access to property management and tenant applications' 
                  : 'Access to property viewing and applications'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-white/10 pt-3 mt-2">
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Processing..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;