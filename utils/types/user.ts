export interface UserProfile {
    id: string;
    full_name: string;
    email_address: string;
    phone_number?: string | null;
    user_role: 'tenant' | 'landlord';
    created_at: string;
    profile_photo?: string | null;
  }
  
  export interface UserPreferences {
    notification_email: boolean;
    notification_sms: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  }
  
  export interface AuthState {
    isAuthenticating: boolean;
    isAuthenticated: boolean;
    user: any | null;
    profile: UserProfile | null;
    authError: string | null;
  }
  