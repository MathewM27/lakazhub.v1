'use client';

import { useState, useRef } from 'react';
import { supabase } from '../lib/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImageUploadTester() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`File selected: ${selectedFile.name} (${selectedFile.type}, ${selectedFile.size} bytes)`);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadedUrl(null);
      addLog(`Starting upload for file: ${file.name}`);

      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!authData?.session) {
        throw new Error('You must be logged in to upload files');
      }
      
      addLog(`Authenticated as: ${authData.session.user.id}`);

      // Create a unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `test-uploads/test-${timestamp}.${fileExt}`;
      
      addLog(`Uploading to path: ${fileName}`);
      addLog(`File type: ${file.type}, size: ${file.size} bytes`);

      // Convert file to arrayBuffer for more reliable binary data handling
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);
      
      addLog(`Converted file to binary buffer (${fileBuffer.length} bytes)`);
      
      // Upload the file with explicit content type
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, fileBuffer, {
          cacheControl: '3600',
          contentType: file.type, // Explicitly set the content type
          upsert: true
        });

      if (error) {
        throw new Error(`Upload error: ${error.message}`);
      }

      addLog(`Upload successful! Path: ${data?.path}`);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data?.path || fileName);

      if (urlData?.publicUrl) {
        setUploadedUrl(urlData.publicUrl);
        addLog(`Public URL: ${urlData.publicUrl}`);
        
        // Verify the image can be loaded
        const testImg = new Image();
        testImg.onload = () => {
          addLog(`Image loaded successfully: ${testImg.width}x${testImg.height}`);
        };
        testImg.onerror = () => {
          addLog(`WARNING: Image failed pre-load test - URL might be valid but image data could be corrupted`);
        };
        testImg.src = urlData.publicUrl;
      } else {
        throw new Error('Failed to get public URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`ERROR: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Image Upload Tester</CardTitle>
        <CardDescription>
          Test direct image uploads to Supabase storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Select Image
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <span className="text-sm">
              {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'No file selected'}
            </span>
          </div>

          <Button 
            onClick={uploadFile} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          {uploadedUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Image:</p>
              <div className="border rounded overflow-hidden">
                <img 
                  src={uploadedUrl} 
                  alt="Uploaded" 
                  className="w-full h-auto max-h-[300px] object-contain"
                  onError={() => {
                    addLog("ERROR: Image failed to load (possibly corrupted)");
                    // Try to open the image in a new tab to see if it's a CORS issue
                    window.open(uploadedUrl, '_blank');
                  }}
                  crossOrigin="anonymous"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                    Open in New Tab
                  </a>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedUrl);
                    addLog("URL copied to clipboard");
                  }}
                >
                  Copy URL
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Logs:</p>
            <div className="bg-gray-100 p-3 rounded h-[200px] overflow-y-auto text-xs font-mono">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="pb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No logs yet</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setLogs([]);
            setError(null);
            setUploadedUrl(null);
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        >
          Clear
        </Button>
      </CardFooter>
    </Card>
  );
}
