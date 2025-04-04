'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, User as UserIcon, X } from "lucide-react";
import { supabase } from "../lib/utils/supabase/client";
import { useAuth } from '../auth/AuthHandler';

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
    } catch (err: any) {
      console.error('Error changing email:', err);
      setError(err.message || 'Failed to change email');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // This would need proper backend implementation to fully delete the account
        // For now just showing the UI interaction
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
      <DialogContent className="sm:max-w-md rounded-lg border-0 shadow-lg">
        <DialogHeader className="relative">
          <div className="absolute top-0 right-0">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mb-2">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
          </div>
          <DialogTitle className="text-xl text-center font-semibold">
            My Profile
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md flex items-center mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Full Name</Label>
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-md font-medium">
                {user?.user_metadata?.full_name || 'Not provided'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Email Address</Label>
            {isChangingEmail ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="New email address"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsChangingEmail(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleEmailChange}>
                    Update Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-md font-medium">{user?.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsChangingEmail(true)}>
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Subscription</Label>
              <Badge variant="outline" className="text-gray-400 border-gray-300">Coming soon</Badge>
            </div>
            <div className="px-3 py-2 border border-dashed rounded-md bg-gray-50">
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Premium features will be available soon</p>
                <Button variant="outline" disabled className="mt-2">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Processing..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
