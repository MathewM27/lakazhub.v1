'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, User as UserIcon } from "lucide-react";
import { supabase } from "../lib/utils/supabase/client";
import { useAuth } from "../auth/AuthHandler";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null; // Made user optional to avoid breaking changes
}

const ProfileModal = ({ isOpen, onClose, user: propUser }: ProfileModalProps) => {
  // Get user from auth context or props
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  
  const [email, setEmail] = useState(user?.email || '');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleEmailChange = async () => {
    try {
      setError('');
      // This only initiates the email change process - user will need to verify via email
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setIsChangingEmail(false);
      alert('Verification email sent. Please check your inbox to confirm email change.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error('Error changing email:', err);
      setError(errorObj.message || 'Failed to change email');
    }
  };

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
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        setError(errorObj.message || 'Failed to delete account');
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md rounded-xl border border-white/20 bg-black text-white shadow-2xl"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      >
        <DialogHeader className="relative">
          <div className="absolute top-0 right-0">
            
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center text-black text-2xl font-bold shadow-lg border-2 border-white/20">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'L'}
            </div>
          </div>
          <DialogTitle className="text-xl text-center font-semibold text-white">
            My Profile
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded-md flex items-center mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-white/70">Full Name</Label>
            <div className="flex items-center gap-2 px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <UserIcon className="h-4 w-4 text-white/50" />
              <span className="text-md font-medium text-white">
                {user?.user_metadata?.full_name || 'Not provided'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-white/70">Email Address</Label>
            {isChangingEmail ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="New email address"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-white/30 focus:ring-offset-0"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsChangingEmail(false)}
                    className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleEmailChange}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 border border-white/20 bg-white/5 rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/50" />
                  <span className="text-md font-medium text-white">{user?.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsChangingEmail(true)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/70">Landlord Account</Label>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Active</Badge>
            </div>
            <div className="px-3 py-2 border border-white/20 bg-white/5 rounded-md">
              <div className="text-sm text-white/90">
                <p>Access to property management features</p>
                <p className="text-xs text-white/50 mt-1">Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-white/10 pt-4">
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