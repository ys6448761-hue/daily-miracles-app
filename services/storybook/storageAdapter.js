/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Storybook Storage Adapter (C6 RAMADA)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles storage for storybook assets with provider abstraction.
 * - Development/Test: Local FS storage
 * - Staging/Production: AWS S3 with signed URLs, EXIF removal, privacy enforcement
 *
 * Features:
 *   - Local FS storage (dev/test only)
 *   - AWS S3 storage with signed URLs (staging/production)
 *   - EXIF metadata removal (privacy)
 *   - Signed URL generation (15-min expiry configurable)
 *   - Authorization enforcement (journey-based access)
 *   - Safe replacement (new upload → DB update → cleanup)
 *
 * Configuration:
 *   STORAGE_TYPE=local|s3
 *   AWS_REGION=us-east-1
 *   AWS_S3_BUCKET=storybook-assets-[env]
 *   AWS_ACCESS_KEY_ID=...
 *   AWS_SECRET_ACCESS_KEY=...
 *   SIGNED_URL_TTL_SECONDS=900 (default 15 min)
 *
 * Design:
 *   - Factory pattern (local vs S3 adapter)
 *   - Async file I/O with error propagation
 *   - NODE_ENV enforcement (local storage only in dev)
 *   - Privacy-first (no plaintext URLs in DB)
 *
 * @since 2026-08-29 (C6: Production bridge)
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Optional: AWS S3 SDK (production only, not required for Supabase)
let S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, getSignedUrl;
try {
  const s3 = require('@aws-sdk/client-s3');
  const presigner = require('@aws-sdk/s3-request-presigner');
  S3Client = s3.S3Client;
  PutObjectCommand = s3.PutObjectCommand;
  GetObjectCommand = s3.GetObjectCommand;
  HeadObjectCommand = s3.HeadObjectCommand;
  DeleteObjectCommand = s3.DeleteObjectCommand;
  getSignedUrl = presigner.getSignedUrl;
} catch (e) {
  // S3 not available (staging/dev can use Supabase instead)
  console.warn('⚠️ AWS S3 SDK not installed. S3StorageAdapter unavailable. Use STORAGE_TYPE=supabase or local.');
}

class LocalStorageAdapter {
  constructor() {
    this.storageRoot = path.join(process.cwd(), 'public', 'images', 'storybook');
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Save file to local FS (dev only)
   * Enforces NODE_ENV check — throws in production
   *
   * @param {Buffer} buffer - File content
   * @param {string} objectKey - Storage path (e.g., 'journeys/uuid/photo_01.jpg')
   * @param {string} mimeType - MIME type for Content-Type
   * @returns {Promise<string>} Public URL path (e.g., /images/storybook/journeys/uuid/photo_01.jpg)
   * @throws {Error} If NODE_ENV=production or I/O fails
   */
  async saveFile(buffer, objectKey, mimeType) {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_STORAGE) {
      throw new Error('Local storage not permitted in production. Use cloud storage (S3/GCS).');
    }

    if (!buffer || !objectKey || !mimeType) {
      throw new Error('buffer, objectKey, and mimeType are required');
    }

    try {
      // Parse the object key to build file path
      // objectKey format: journeys/{journey_id}/{location}_{slot}.ext
      const filePath = path.join(this.storageRoot, objectKey);
      const directory = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      // Return public URL path
      return `/images/storybook/${objectKey}`;
    } catch (error) {
      console.error('[STORAGE_SAVE_ERROR]', {
        objectKey,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Remove EXIF and other metadata from image buffer
   * Uses Sharp for safe, lossless metadata stripping
   *
   * @param {Buffer} buffer - Image file content
   * @returns {Promise<Buffer>} Image buffer without EXIF
   * @throws {Error} If buffer is not a valid image
   */
  async removeExif(buffer) {
    if (!buffer) {
      throw new Error('buffer is required');
    }

    try {
      // Sharp strips metadata by default when withMetadata(false) is used
      const cleanedBuffer = await sharp(buffer)
        .withMetadata(false)
        .toBuffer();

      return cleanedBuffer;
    } catch (error) {
      console.error('[EXIF_REMOVAL_ERROR]', {
        error: error.message,
        bufferSize: buffer.length
      });
      throw new Error(`Failed to remove EXIF: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for object retrieval
   * In local FS, this returns a simple public path.
   * In production (S3/GCS), this would generate signed URLs with expiry.
   *
   * @param {string} objectKey - Storage path
   * @param {number} expirySeconds - URL expiration time (default 900s = 15min)
   * @returns {Promise<string>} Public or signed URL
   */
  async getSignedUrl(objectKey, expirySeconds = 900) {
    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      // In local FS, return a simple public path
      // In production, this would call S3/GCS SDK
      const publicUrl = `/images/storybook/${objectKey}`;
      return publicUrl;
    } catch (error) {
      console.error('[GET_SIGNED_URL_ERROR]', {
        objectKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if file exists at objectKey
   * @param {string} objectKey - Storage path
   * @returns {Promise<boolean>}
   */
  async fileExists(objectKey) {
    if (!objectKey) {
      return false;
    }

    try {
      const filePath = path.join(this.storageRoot, objectKey);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete file from local FS
   * @param {string} objectKey - Storage path
   * @returns {Promise<boolean>} true if deleted, false if not found
   */
  async deleteFile(objectKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_STORAGE) {
      throw new Error('Local storage operations not permitted in production');
    }

    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      const filePath = path.join(this.storageRoot, objectKey);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File not found
      }
      throw error;
    }
  }

  /**
   * Get file size in bytes
   * @param {string} objectKey - Storage path
   * @returns {Promise<number>} File size in bytes
   */
  async getFileSize(objectKey) {
    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      const filePath = path.join(this.storageRoot, objectKey);
      const stat = await fs.stat(filePath);
      return stat.size;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * AWS S3 Storage Adapter (Production/Staging)
 * Provides secure storage with signed URLs and privacy enforcement
 */
class S3StorageAdapter {
  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.ttlSeconds = parseInt(process.env.SIGNED_URL_TTL_SECONDS || '900', 10);

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    this.s3Client = new S3Client({ region: this.region });
  }

  /**
   * Save file to S3 (production/staging)
   * - EXIF must be removed before calling
   * - Private bucket, no public URLs
   * - Caller must have journey authorization
   *
   * @param {Buffer} buffer - File content (EXIF-removed)
   * @param {string} objectKey - S3 path (journeys/{journey_id}/{location}/{slot}.ext)
   * @param {string} mimeType - MIME type for Content-Type
   * @returns {Promise<string>} S3 object key (stable for DB storage)
   * @throws {Error} If S3 upload fails
   */
  async saveFile(buffer, objectKey, mimeType) {
    if (!buffer || !objectKey || !mimeType) {
      throw new Error('buffer, objectKey, and mimeType are required');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
        // Private bucket: no public access
        ACL: 'private',
        // Add metadata for audit trail
        Metadata: {
          'upload-time': new Date().toISOString(),
          'source': 'storybook-ramada'
        }
      });

      await this.s3Client.send(command);

      // Return stable object key (not URL)
      // Frontend must call getSignedUrl to retrieve
      return objectKey;
    } catch (error) {
      console.error('[S3_SAVE_ERROR]', {
        bucket: this.bucket,
        objectKey,
        error: error.message
      });
      throw new Error(`Failed to save to S3: ${error.message}`);
    }
  }

  /**
   * Remove EXIF and other metadata from image buffer
   * Uses Sharp for safe, lossless metadata stripping
   *
   * @param {Buffer} buffer - Image file content
   * @returns {Promise<Buffer>} Image buffer without EXIF
   * @throws {Error} If buffer is not a valid image
   */
  async removeExif(buffer) {
    if (!buffer) {
      throw new Error('buffer is required');
    }

    try {
      const cleanedBuffer = await sharp(buffer)
        .withMetadata(false)
        .toBuffer();

      return cleanedBuffer;
    } catch (error) {
      console.error('[EXIF_REMOVAL_ERROR]', {
        error: error.message,
        bufferSize: buffer.length
      });
      throw new Error(`Failed to remove EXIF: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for object retrieval
   * - Time-limited (default 15 min)
   * - Caller must have journey authorization
   * - URL not stored in DB (regenerated per request)
   *
   * @param {string} objectKey - S3 object key
   * @param {number} expirySeconds - URL expiration (default 900s = 15min)
   * @returns {Promise<string>} Signed URL (valid for expirySeconds)
   * @throws {Error} If signing fails
   */
  async getSignedUrl(objectKey, expirySeconds = null) {
    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      const ttl = expirySeconds || this.ttlSeconds;

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: ttl });
      return signedUrl;
    } catch (error) {
      console.error('[GET_SIGNED_URL_ERROR]', {
        bucket: this.bucket,
        objectKey,
        error: error.message
      });
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Check if object exists in S3
   * @param {string} objectKey - S3 object key
   * @returns {Promise<boolean>}
   */
  async fileExists(objectKey) {
    if (!objectKey) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete object from S3 (GDPR compliance, safe cleanup)
   * Called after confirming new asset uploaded successfully
   *
   * @param {string} objectKey - S3 object key
   * @returns {Promise<boolean>} true if deleted, false if not found
   * @throws {Error} If deletion fails
   */
  async deleteFile(objectKey) {
    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get object metadata (size, last modified)
   * @param {string} objectKey - S3 object key
   * @returns {Promise<{size: number, lastModified: Date}>}
   */
  async getFileSize(objectKey) {
    if (!objectKey) {
      throw new Error('objectKey is required');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey
      });

      const response = await this.s3Client.send(command);
      return response.ContentLength || 0;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Factory: Create appropriate adapter based on STORAGE_TYPE
 * @returns {LocalStorageAdapter|S3StorageAdapter}
 */
function createStorageAdapter() {
  const storageType = process.env.STORAGE_TYPE || 'local';

  if (storageType === 's3') {
    return new S3StorageAdapter();
  }

  if (storageType === 'local') {
    // Enforce: local storage only in development
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_STORAGE) {
      throw new Error('Local storage not permitted in production. Set STORAGE_TYPE=s3 and configure AWS credentials.');
    }
    return new LocalStorageAdapter();
  }

  throw new Error(`Unknown STORAGE_TYPE: ${storageType}. Use 'local', 's3', or 'supabase'.`);
}

/**
 * Supabase Storage Adapter (C7A Staging)
 * Backend-only with service role key (no frontend access)
 * Private bucket, signed URLs, EXIF removal
 *
 * Security Model:
 * - Service role key: backend-only (Render env secrets)
 * - Never exposed to client code, logs, git, or .env
 * - RLS policies not needed (service role has full access)
 * - Signed URLs generated server-side, 15-min expiry
 */
class SupabaseStorageAdapter {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'storybook-assets';
    this.ttlSeconds = parseInt(process.env.SIGNED_URL_TTL_SECONDS || '900', 10);

    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for Supabase Storage');
    }

    const { createClient } = require('@supabase/supabase-js');
    // Service role key: backend-only, full permissions, no RLS restrictions
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceRoleKey);
  }

  async saveFile(buffer, objectKey, mimeType) {
    if (!buffer || !objectKey || !mimeType) {
      throw new Error('buffer, objectKey, and mimeType are required');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(objectKey, buffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
      }

      return objectKey;
    } catch (error) {
      console.error('[SUPABASE_STORAGE_SAVE_ERROR]', { objectKey, error: error.message });
      throw error;
    }
  }

  async removeExif(buffer) {
    if (!buffer) throw new Error('buffer is required');

    try {
      return await sharp(buffer).withMetadata(false).toBuffer();
    } catch (error) {
      console.error('[EXIF_REMOVAL_ERROR]', { error: error.message, bufferSize: buffer.length });
      throw new Error(`Failed to remove EXIF: ${error.message}`);
    }
  }

  async getSignedUrl(objectKey, expirySeconds = null) {
    if (!objectKey) throw new Error('objectKey is required');

    try {
      const ttl = expirySeconds || this.ttlSeconds;
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .createSignedUrl(objectKey, ttl);

      if (error) throw new Error(`Supabase Storage signed URL failed: ${error.message}`);
      return data.signedUrl;
    } catch (error) {
      console.error('[SUPABASE_SIGNED_URL_ERROR]', { objectKey, error: error.message });
      throw error;
    }
  }

  async fileExists(objectKey) {
    if (!objectKey) return false;
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .list(objectKey.split('/').slice(0, -1).join('/'));
      if (error) return false;
      return data.some(f => f.name === objectKey.split('/').pop());
    } catch (error) {
      return false;
    }
  }

  async deleteFile(objectKey) {
    if (!objectKey) throw new Error('objectKey is required');
    try {
      const { error } = await this.supabase.storage.from(this.storageBucket).remove([objectKey]);
      if (error && error.message !== 'not found') throw error;
      return !error;
    } catch (error) {
      console.error('[SUPABASE_DELETE_ERROR]', { objectKey, error: error.message });
      throw error;
    }
  }

  async getFileSize(objectKey) {
    if (!objectKey) throw new Error('objectKey is required');
    try {
      const { data, error } = await this.supabase.storage.from(this.storageBucket).info(objectKey);
      if (error) throw error;
      return data.metadata.size || 0;
    } catch (error) {
      throw error;
    }
  }
}

// Export factory function + constructors for testing
module.exports = createStorageAdapter();
module.exports.LocalStorageAdapter = LocalStorageAdapter;
module.exports.S3StorageAdapter = S3StorageAdapter;
module.exports.SupabaseStorageAdapter = SupabaseStorageAdapter;
module.exports.createStorageAdapter = createStorageAdapter;
