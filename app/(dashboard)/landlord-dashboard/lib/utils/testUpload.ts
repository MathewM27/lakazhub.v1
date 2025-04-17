// import { supabase } from './supabase/client';

// /**
//  * Simple function to test direct file uploads to Supabase storage
//  * You can call this from a component to verify basic upload functionality
//  */
// export async function testStorageUpload(file: File): Promise<string | null> {
//   console.log('Test upload starting...');
//   console.log(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
  
//   try {
//     // Check auth status first
//     const { data: authData, error: authError } = await supabase.auth.getUser();
//     if (authError || !authData.user) {
//       console.error('Authentication error:', authError);
//       return null;
//     }
    
//     console.log('Authenticated user:', authData.user.id);
    
//     // Create a test file path
//     const timestamp = new Date().getTime();
//     const fileExt = file.name.split('.').pop();
//     const fileName = `test-upload/${timestamp}.${fileExt}`;
    
//     console.log(`Uploading to path: ${fileName}`);
    
//     // Try direct upload
//     const { data, error } = await supabase.storage
//       .from('property-images')
//       .upload(fileName, file, {
//         cacheControl: '3600',
//         upsert: true,
//         contentType: file.type,
//       });
    
//     if (error) {
//       console.error('Upload error:', error);
//       return null;
//     }
    
//     console.log('Upload successful:', data);
    
//     // Get public URL
//     const { data: urlData } = supabase.storage
//       .from('property-images')
//       .getPublicUrl(data.path);
    
//     console.log('Public URL:', urlData);
    
//     return urlData?.publicUrl || null;
//   } catch (error) {
//     console.error('Test upload error:', error);
//     return null;
//   }
// }
