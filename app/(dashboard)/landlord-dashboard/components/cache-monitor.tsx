"use client";

import { useState, useEffect, useCallback } from 'react';
import { PropertyCache, CacheStats } from '../lib/utils/cache/propertyCache';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Legend, Tooltip } from 'recharts';
import { Shield, Clock, Database, PieChart as PieChartIcon, ListFilter } from 'lucide-react';

export const CacheMonitor = () => {
  const [stats, setStats] = useState<CacheStats>(PropertyCache.getCacheStats());
  const [expanded, setExpanded] = useState(false);
  
  // Instead of checking for API URL, check for Supabase URL which is more important
  const supabaseUrlMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  const usingDirectQueries = true; // We're now always using direct Supabase queries

  useEffect(() => {
    // Set up a listener for cache updates
    PropertyCache.addEventListener('update', () => {
      setStats(PropertyCache.getCacheStats());
    });

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(PropertyCache.getCacheStats());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Format bytes to KB or MB
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Format time duration in a human-readable way
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };
  
  // Get cache settings
  const cacheSettings = PropertyCache.getCacheSettings();

  // Hit rate calculation
  const hitRate = stats.hits + stats.misses > 0 
    ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1) 
    : "0";

  // Prepare chart data
  const hitMissData = [
    { name: 'Hits', value: stats.hits },
    { name: 'Misses', value: stats.misses }
  ];

  // Colors for chart
  const COLORS = ['#4ade80', '#f87171'];

  // Handle detailed cache log
  const handleLogCacheDetails = () => {
    PropertyCache.logCacheContents();
  };

  // Handle cache clearing with debounce to prevent multiple calls
  const handleClearCache = useCallback(() => {
    PropertyCache.clearCache();
    toast({
      title: "Cache Cleared",
      description: "The property cache has been cleared.",
    });
  }, []);

  // If not expanded, show minimal stats in fixed footer
  if (!expanded) {
    return (
      <div className="fixed bottom-0 right-0 z-50 p-4">
        <button 
          onClick={() => setExpanded(true)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition ${
            supabaseUrlMissing 
              ? "bg-red-900/90 text-white border-red-700 hover:bg-red-800" 
              : "bg-zinc-900/90 text-white border-zinc-700 hover:bg-zinc-800"
          }`}
        >
          <Database className={`w-4 h-4 ${supabaseUrlMissing ? "text-red-400" : "text-yellow-400"}`} />
          <span>Cache: {hitRate}% hits {supabaseUrlMissing && "⚠️"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4">
      <div className="bg-zinc-900/90 backdrop-blur text-white rounded-lg border border-zinc-700 shadow-xl w-80 sm:w-96">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-yellow-400" />
            <h3 className="font-medium">Cache Monitor</h3>
          </div>
          <button 
            onClick={() => setExpanded(false)} 
            className="text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* API URL info - updated to show we're using direct queries */}
          {supabaseUrlMissing ? (
            <div className="p-2 bg-red-900/50 border border-red-700/50 rounded text-sm text-white">
              <p>⚠️ <b>NEXT_PUBLIC_SUPABASE_URL</b> is not set!</p>
              <p className="mt-1 text-xs">Please check your environment variables.</p>
            </div>
          ) : usingDirectQueries ? (
            <div className="p-2 bg-amber-900/30 border border-amber-700/40 rounded text-xs text-white">
              <p>Using direct Supabase queries for data access</p>
              <p className="mt-0.5 opacity-80">This ensures reliable data connections</p>
            </div>
          ) : null}
          
          {/* Hit/Miss stats */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-300 text-sm">Hit rate</span>
            </div>
            <span className="font-medium">{hitRate}%</span>
          </div>
          
          {/* Cache size */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-zinc-300 text-sm">Cache size</span>
            </div>
            <span className="font-medium">{formatBytes(stats.size)}</span>
          </div>
          
          {/* Last accessed */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-300 text-sm">Last accessed</span>
            </div>
            <span className="font-medium">{timeAgo(stats.lastAccessed)}</span>
          </div>
          
          {/* Item count */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <span className="text-zinc-300 text-sm">Cached items</span>
            </div>
            <span className="font-medium">{stats.itemCount}</span>
          </div>
          
          {/* Hit/Miss chart */}
          <div className="bg-zinc-800/50 rounded-lg p-3 mt-3">
            <h4 className="text-sm text-zinc-400 mb-2">Cache Performance</h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hitMissData}
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {hitMissData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-700 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={handleClearCache}
                className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
              >
                Clear Cache
              </button>
              <button
                onClick={handleLogCacheDetails}
                className="flex items-center text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
              >
                <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                Log Details
              </button>
            </div>
            <div className="text-xs text-zinc-500">
              Cache expiry: Properties list {formatDuration(cacheSettings.listExpiryMs)}, Details {formatDuration(cacheSettings.propertyExpiryMs)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheMonitor;
function toast(arg0: { title: string; description: string; }) {
    throw new Error('Function not implemented.');
}

