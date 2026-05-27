import { supabaseAdmin } from '../config.js';

/**
 * Log an admin action for audit trail
 */
export async function logAuditAction({
  admin_id,
  action,
  resource_type,
  resource_id,
  before_values,
  after_values,
  ip_address
}) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        admin_id,
        action,
        resource_type,
        resource_id,
        before_values: before_values || {},
        after_values: after_values || {},
        ip_address: ip_address || 'unknown',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[AUDIT_LOG_ERROR]', error);
    }
  } catch (err) {
    console.error('[AUDIT_SERVICE_ERROR]', err);
  }
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(filters = {}) {
  try {
    const { page = 1, limit = 50, admin_id, action, resource_type } = filters;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (admin_id) query = query.eq('admin_id', admin_id);
    if (action) query = query.eq('action', action);
    if (resource_type) query = query.eq('resource_type', resource_type);

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      logs: data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (err) {
    console.error('[GET_AUDIT_LOGS_ERROR]', err);
    throw err;
  }
}
