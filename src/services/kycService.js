/**
 * KYC Service for Alpha Global Market
 * Handles KYC document uploads and verification status
 */

import { supabase } from '../supabase/config';
import { logger } from '../utils/logger';
import emailServiceProxy from './emailServiceProxy';

class KYCService {
  constructor() {
    this.bucketName = 'kyc-documents';
  }

  /**
   * Upload a KYC document to Supabase Storage
   * @param {File} file - The file to upload
   * @param {string} userId - User ID
   * @param {string} documentType - Type of document (front, back, selfie, address)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadDocument(file, userId, documentType) {
    try {
      // Create a unique file name
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Error uploading KYC document:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      logger.info(`KYC document uploaded: ${documentType} for user ${userId}`);
      return { success: true, url: publicUrl, path: fileName };
    } catch (error) {
      logger.error('Error in uploadDocument:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit KYC verification request
   * @param {Object} kycData - KYC submission data
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async submitKYCVerification(kycData) {
    try {
      const {
        userId,
        email,
        residenceCountry,
        documentCountry,
        documentType,
        frontDocument,
        backDocument,
        selfieDocument,
        addressDocument
      } = kycData;

      // Insert KYC submission into database
      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: userId,
          email: email,
          residence_country: residenceCountry,
          document_country: documentCountry,
          document_type: documentType,
          front_document_url: frontDocument,
          back_document_url: backDocument,
          selfie_document_url: selfieDocument,
          address_proof_url: addressDocument,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error submitting KYC:', error);
        return { success: false, error: error.message };
      }

      // Send notification email to admin
      try {
        await this.notifyAdminNewKYC(email, userId);
      } catch (emailError) {
        logger.warn('Failed to send KYC notification email:', emailError);
      }

      logger.info(`KYC verification submitted for user ${userId}`);
      return { success: true, verificationId: data.id };
    } catch (error) {
      logger.error('Error in submitKYCVerification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get KYC verification status for a user
   * @param {string} userId - User ID
   * @returns {Promise<{status: string, details?: Object}>}
   */
  async getKYCStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No KYC submission found
          return { status: 'not_submitted' };
        }
        throw error;
      }

      return {
        status: data.status,
        details: {
          submittedAt: data.submitted_at,
          reviewedAt: data.reviewed_at,
          rejectionReason: data.rejection_reason
        }
      };
    } catch (error) {
      logger.error('Error getting KYC status:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Update KYC verification status (admin function)
   * @param {string} verificationId - Verification ID
   * @param {string} status - New status (approved/rejected)
   * @param {string} reason - Rejection reason (if rejected)
   * @returns {Promise<{success: boolean}>}
   */
  async updateKYCStatus(verificationId, status, reason = null) {
    try {
      // Get verification details first
      const { data: verification } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (!verification) {
        return { success: false, error: 'Verification not found' };
      }

      // Update status
      const { error } = await supabase
        .from('kyc_verifications')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', verificationId);

      if (error) {
        throw error;
      }

      // Update user's KYC status
      await supabase
        .from('users')
        .update({
          kyc_verified: status === 'approved',
          kyc_status: status
        })
        .eq('id', verification.user_id);

      // Send email notification
      if (status === 'approved') {
        await emailServiceProxy.sendKYCApprovedEmail({
          email: verification.email,
          name: verification.email.split('@')[0]
        });
      } else if (status === 'rejected') {
        await emailServiceProxy.sendKYCRejectedEmail(
          {
            email: verification.email,
            name: verification.email.split('@')[0]
          },
          reason
        );
      }

      logger.info(`KYC status updated to ${status} for verification ${verificationId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error updating KYC status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify admin about new KYC submission
   * @param {string} userEmail - User's email
   * @param {string} userId - User's ID
   */
  async notifyAdminNewKYC(userEmail, userId) {
    // This would typically send an email to admin
    // For now, just log it
    logger.info(`New KYC submission from ${userEmail} (${userId})`);
  }

  /**
   * Delete KYC documents (for re-submission)
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean}>}
   */
  async deleteKYCDocuments(userId) {
    try {
      // List all files for this user
      const { data: files, error: listError } = await supabase.storage
        .from(this.bucketName)
        .list(userId);

      if (listError) {
        throw listError;
      }

      if (files && files.length > 0) {
        // Delete all files
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from(this.bucketName)
          .remove(filePaths);

        if (deleteError) {
          throw deleteError;
        }
      }

      logger.info(`KYC documents deleted for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting KYC documents:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const kycService = new KYCService();
export default kycService;