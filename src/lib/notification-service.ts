import type { Database } from '../types/supabase';
import { supabase } from './supabase';

type Status = Database['public']['Enums']['grievance_status'];
type NotificationType = 'status_update' | 'reminder' | 'solution' | 'escalation';

interface NotificationTemplate {
  subject: string;
  text: string;
  html: string;
}

// Store notifications in Supabase for in-app access
async function storeNotification(
  userId: string | null,
  grievanceId: string,
  type: NotificationType,
  message: string
) {
  try {
    await supabase.from('notifications').insert([{
      user_id: userId,
      grievance_id: grievanceId,
      type,
      message,
      read: false,
      created_at: new Date().toISOString()
    }]);
  } catch (error) {
    console.error('Error storing notification:', error);
  }
}

// Get notification template based on type and status
function getNotificationTemplate(
  type: NotificationType,
  grievanceId: string,
  title: string,
  newStatus?: Status
): NotificationTemplate {
  const templates: Record<NotificationType, NotificationTemplate> = {
    status_update: {
      subject: `Grievance Status Update - ${title}`,
      text: `Your grievance (ID: ${grievanceId}) status has been updated to: ${newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Grievance Status Update</h2>
          <p>Your grievance (ID: ${grievanceId}) status has been updated to: <strong>${newStatus}</strong></p>
          <p>You can track your grievance status at any time by visiting our website.</p>
        </div>
      `
    },
    reminder: {
      subject: `Action Required - Grievance ${title}`,
      text: `Your grievance (ID: ${grievanceId}) requires attention. Please check the status and any required actions.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Action Required</h2>
          <p>Your grievance (ID: ${grievanceId}) requires attention.</p>
          <p>Please log in to check the status and any required actions.</p>
        </div>
      `
    },
    solution: {
      subject: `Solution Available - Grievance ${title}`,
      text: `A solution has been proposed for your grievance (ID: ${grievanceId}). Please review it.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Solution Available</h2>
          <p>A solution has been proposed for your grievance (ID: ${grievanceId}).</p>
          <p>Please log in to review the solution and provide feedback.</p>
        </div>
      `
    },
    escalation: {
      subject: `Grievance Escalated - ${title}`,
      text: `Your grievance (ID: ${grievanceId}) has been escalated for priority handling.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Grievance Escalated</h2>
          <p>Your grievance (ID: ${grievanceId}) has been escalated for priority handling.</p>
          <p>You will receive updates as soon as there's progress.</p>
        </div>
      `
    }
  };

  return templates[type];
}

export async function sendNotification(
  email: string | null,
  userId: string | null,
  grievanceId: string,
  title: string,
  type: NotificationType,
  newStatus?: Status
) {
  try {
    const template = getNotificationTemplate(type, grievanceId, title, newStatus);

    // Store in-app notification
    await storeNotification(userId, grievanceId, type, template.text);

    // Email notifications are handled by the server API
    if (email) {
      // Make API call to server endpoint for email sending
      const response = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export async function sendStatusUpdateEmail(
  email: string,
  grievanceId: string,
  title: string,
  newStatus: Status,
  userId?: string
) {
  return sendNotification(email, userId || null, grievanceId, title, 'status_update', newStatus);
}

export async function sendReminder(
  email: string,
  grievanceId: string,
  title: string,
  userId?: string
) {
  return sendNotification(email, userId || null, grievanceId, title, 'reminder');
}

export async function sendSolutionNotification(
  email: string,
  grievanceId: string,
  title: string,
  userId?: string
) {
  return sendNotification(email, userId || null, grievanceId, title, 'solution');
}

export async function sendEscalationNotification(
  email: string,
  grievanceId: string,
  title: string,
  userId?: string
) {
  return sendNotification(email, userId || null, grievanceId, title, 'escalation');
}

// Get unread notifications for a user
export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
} 