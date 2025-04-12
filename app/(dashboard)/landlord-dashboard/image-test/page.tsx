'use client';

import ImageUploadTester from '../components/ImageUploadTester';

export default function ImageTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Image Upload Test Page</h1>
      <p className="mb-6 text-muted-foreground">
        Use this tool to test direct image uploads to Supabase storage without any additional processing.
      </p>
      
      <ImageUploadTester />
    </div>
  );
}
