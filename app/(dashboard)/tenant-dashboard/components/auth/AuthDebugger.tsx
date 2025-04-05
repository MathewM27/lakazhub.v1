'use client';

import { useState } from 'react';
import { useAuth } from '../../auth/AuthHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AuthDebugger() {
  const { user, profile, isAuthenticated, isAuthenticating, hasCorrectRole, signOut } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  
  // Get cache information
  const getCacheInfo = () => {
    const cacheInfo: {
      sessionStorage: Record<string, string | null>;
      localStorage: Record<string, string | null>;
    } = {
      sessionStorage: {},
      localStorage: {}
    };
    
    if (typeof window === 'undefined') return cacheInfo;
    
    // Get session storage items
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          cacheInfo.sessionStorage[key] = sessionStorage.getItem(key);
        } catch (e) {
          cacheInfo.sessionStorage[key] = 'Error reading value';
        }
      }
    }
    
    // Get local storage items related to auth
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('tenant_profile_') || key.includes('auth'))) {
        try {
          cacheInfo.localStorage[key] = localStorage.getItem(key);
        } catch (e) {
          cacheInfo.localStorage[key] = 'Error reading value';
        }
      }
    }
    
    return cacheInfo;
  };
  
  // Clear tenant-specific caches
  const clearCaches = () => {
    // Clear auth status cache
    sessionStorage.removeItem('auth_status');
    sessionStorage.removeItem('auth_status_time');
    
    // Clear profile caches
    if (user) {
      localStorage.removeItem(`tenant_profile_${user.id}`);
      localStorage.removeItem(`tenant_profile_${user.id}_time`);
    }
    
    // Clear all tenant profile caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('tenant_profile_') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    alert('All tenant authentication caches cleared');
  };

  if (isAuthenticating) {
    return <div>Loading authentication...</div>;
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Tenant Auth Debugger</CardTitle>
          <div className="flex gap-2">
            <Badge variant={isAuthenticated ? "outline" : "destructive"} className={isAuthenticated ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
            <Badge variant={hasCorrectRole ? "outline" : "destructive"} className={hasCorrectRole ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
              {hasCorrectRole ? "Tenant Role" : "Wrong Role"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide' : 'Show'} User Data
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowCacheInfo(!showCacheInfo)}
          >
            {showCacheInfo ? 'Hide' : 'Show'} Cache Info
          </Button>
          
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={clearCaches}
          >
            Clear Caches
          </Button>
          
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={signOut}
          >
            Sign Out
          </Button>
        </div>
        
        {showDebug && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1 text-sm">User:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 border">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-1 text-sm">Profile:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 border">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {showCacheInfo && (
          <div>
            <h4 className="font-medium mb-1 text-sm">Cache Information:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 border">
              {JSON.stringify(getCacheInfo(), null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}