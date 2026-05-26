import { supabaseAdmin } from '../config.js';
import { trackUsage } from './subscription.js';

/**
 * Get user's current usage statistics
 */
export async function getUserUsageStats(userId, timeRange = 'month') {
  try {
    let startDate = new Date();

    if (timeRange === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setDate(1);
    } else if (timeRange === 'year') {
      startDate.setMonth(0, 1);
    }

    const { data: usage, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by resource type
    const stats = {
      essays_created: 0,
      applications_created: 0,
      documents_uploaded: 0,
      scholarships_viewed: 0,
      total_actions: usage?.length || 0,
      by_resource: {}
    };

    if (usage) {
      usage.forEach(item => {
        if (!stats.by_resource[item.resource]) {
          stats.by_resource[item.resource] = 0;
        }
        stats.by_resource[item.resource]++;

        switch (item.resource) {
          case 'essays':
            stats.essays_created++;
            break;
          case 'applications':
            stats.applications_created++;
            break;
          case 'documents':
            stats.documents_uploaded++;
            break;
          case 'scholarships':
            stats.scholarships_viewed++;
            break;
        }
      });
    }

    return stats;
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return {
      essays_created: 0,
      applications_created: 0,
      documents_uploaded: 0,
      scholarships_viewed: 0,
      total_actions: 0,
      by_resource: {}
    };
  }
}

/**
 * Log an essay generation event
 */
export async function logEssayGeneration(userId, essayId, prompt, tokensUsed = 0) {
  return trackUsage(userId, 'essays', {
    essay_id: essayId,
    prompt: prompt?.substring(0, 200), // Store first 200 chars of prompt
    tokens_used: tokensUsed,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log a scholarship view event
 */
export async function logScholarshipView(userId, scholarshipId) {
  return trackUsage(userId, 'scholarships', {
    scholarship_id: scholarshipId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log an application creation event
 */
export async function logApplicationCreation(userId, scholarshipId, applicationId) {
  return trackUsage(userId, 'applications', {
    scholarship_id: scholarshipId,
    application_id: applicationId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log a document upload event
 */
export async function logDocumentUpload(userId, documentId, size, type) {
  return trackUsage(userId, 'documents', {
    document_id: documentId,
    file_size: size,
    file_type: type,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get usage summary for admin dashboard
 */
export async function getSystemUsageStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: usage, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total_events: usage?.length || 0,
      unique_users: new Set(),
      by_resource: {},
      daily_breakdown: {}
    };

    if (usage) {
      usage.forEach(item => {
        stats.unique_users.add(item.user_id);

        if (!stats.by_resource[item.resource]) {
          stats.by_resource[item.resource] = 0;
        }
        stats.by_resource[item.resource]++;

        const day = new Date(item.created_at).toISOString().split('T')[0];
        if (!stats.daily_breakdown[day]) {
          stats.daily_breakdown[day] = 0;
        }
        stats.daily_breakdown[day]++;
      });
    }

    stats.unique_users = stats.unique_users.size;

    return stats;
  } catch (error) {
    console.error('Error getting system usage stats:', error);
    return {
      total_events: 0,
      unique_users: 0,
      by_resource: {},
      daily_breakdown: {}
    };
  }
}
