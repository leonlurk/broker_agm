// Supabase Storage Service
// Mirrors Firebase Storage functionality

import { supabase } from './config';
import { logger } from '../utils/logger';

// Storage bucket names
const PROFILE_PICTURES_BUCKET = 'profile-pictures';

/**
 * Initialize storage buckets if they don't exist
 * Run this once during setup
 */
export const initializeStorageBuckets = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      logger.error('[Supabase Storage] Error listing buckets', listError);
      return { success: false, error: listError };
    }

    const bucketExists = buckets.some(bucket => bucket.name === PROFILE_PICTURES_BUCKET);

    if (!bucketExists) {
      // Create the bucket with public access
      const { data, error } = await supabase.storage.createBucket(PROFILE_PICTURES_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        logger.error('[Supabase Storage] Error creating bucket', error);
        return { success: false, error };
      }

      logger.info('[Supabase Storage] Bucket created successfully', { bucket: PROFILE_PICTURES_BUCKET });
    } else {
      logger.info('[Supabase Storage] Bucket already exists', { bucket: PROFILE_PICTURES_BUCKET });
    }

    return { success: true };
  } catch (error) {
    logger.error('[Supabase Storage] Error in bucket initialization', error);
    return { success: false, error };
  }
};

/**
 * Upload profile picture
 * Mirrors Firebase uploadBytes functionality
 */
export const uploadProfilePicture = async (userId, file, fileName = null) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const finalFileName = fileName || `${timestamp}_${file.name}`;
    const filePath = `${userId}/${finalFileName}`;

    logger.info('[Supabase Storage] Uploading profile picture', { 
      userId, 
      fileName: finalFileName,
      fileSize: file.size,
      fileType: file.type
    });

    // Skip bucket existence check - just try to upload
    // The bucket exists, we'll get a specific error if it doesn't

    // Upload the file
    const { data, error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: file.type
      });

    if (error) {
      logger.error('[Supabase Storage] Upload error', error);
      // Provide more specific error messages
      if (error.message?.includes('row level security') || error.message?.includes('policy')) {
        throw new Error('Permission denied. Please check storage policies.');
      } else if (error.message?.includes('Invalid file')) {
        throw new Error('Invalid file format. Please upload an image file.');
      } else if (error.message?.includes('Bucket not found') || error.message?.includes('Object not found')) {
        throw new Error('Storage bucket not found. Please contact support.');
      } else if (error.statusCode === 404) {
        throw new Error('Storage bucket not configured. Please create the profile-pictures bucket.');
      }
      // Return the original error with more context
      throw new Error(`Storage error: ${error.message || 'Unknown error'}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .getPublicUrl(filePath);

    logger.info('[Supabase Storage] Profile picture uploaded successfully', { 
      path: filePath,
      url: publicUrl 
    });

    return {
      success: true,
      path: filePath,
      url: publicUrl,
      error: null
    };
  } catch (error) {
    logger.error('[Supabase Storage] Error uploading profile picture', error);
    return {
      success: false,
      path: null,
      url: null,
      error: error.message
    };
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (userId, fileName) => {
  try {
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .remove([filePath]);

    if (error) {
      logger.error('[Supabase Storage] Delete error', error);
      throw error;
    }

    logger.info('[Supabase Storage] Profile picture deleted successfully', { path: filePath });
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase Storage] Error deleting profile picture', error);
    return { success: false, error: error.message };
  }
};

/**
 * List all profile pictures for a user
 */
export const listUserProfilePictures = async (userId) => {
  try {
    const { data, error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .list(userId, {
        limit: 100,
        offset: 0
      });

    if (error) {
      logger.error('[Supabase Storage] List error', error);
      throw error;
    }

    // Generate public URLs for each file
    const filesWithUrls = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from(PROFILE_PICTURES_BUCKET)
        .getPublicUrl(`${userId}/${file.name}`);

      return {
        ...file,
        url: publicUrl
      };
    });

    return {
      success: true,
      files: filesWithUrls,
      error: null
    };
  } catch (error) {
    logger.error('[Supabase Storage] Error listing profile pictures', error);
    return {
      success: false,
      files: [],
      error: error.message
    };
  }
};

/**
 * Get signed URL for temporary access (if bucket is private)
 */
export const getSignedUrl = async (path, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      logger.error('[Supabase Storage] Signed URL error', error);
      throw error;
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
      error: null
    };
  } catch (error) {
    logger.error('[Supabase Storage] Error creating signed URL', error);
    return {
      success: false,
      signedUrl: null,
      error: error.message
    };
  }
};

/**
 * Download file from storage
 */
export const downloadFile = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .download(path);

    if (error) {
      logger.error('[Supabase Storage] Download error', error);
      throw error;
    }

    return {
      success: true,
      blob: data,
      error: null
    };
  } catch (error) {
    logger.error('[Supabase Storage] Error downloading file', error);
    return {
      success: false,
      blob: null,
      error: error.message
    };
  }
};

/**
 * Move/rename a file
 */
export const moveFile = async (fromPath, toPath) => {
  try {
    const { error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .move(fromPath, toPath);

    if (error) {
      logger.error('[Supabase Storage] Move error', error);
      throw error;
    }

    logger.info('[Supabase Storage] File moved successfully', { from: fromPath, to: toPath });
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase Storage] Error moving file', error);
    return { success: false, error: error.message };
  }
};

/**
 * Copy a file
 */
export const copyFile = async (fromPath, toPath) => {
  try {
    const { error } = await supabase.storage
      .from(PROFILE_PICTURES_BUCKET)
      .copy(fromPath, toPath);

    if (error) {
      logger.error('[Supabase Storage] Copy error', error);
      throw error;
    }

    logger.info('[Supabase Storage] File copied successfully', { from: fromPath, to: toPath });
    return { success: true, error: null };
  } catch (error) {
    logger.error('[Supabase Storage] Error copying file', error);
    return { success: false, error: error.message };
  }
};

// Export all functions
export default {
  initializeStorageBuckets,
  uploadProfilePicture,
  deleteProfilePicture,
  listUserProfilePictures,
  getSignedUrl,
  downloadFile,
  moveFile,
  copyFile,
  PROFILE_PICTURES_BUCKET
};