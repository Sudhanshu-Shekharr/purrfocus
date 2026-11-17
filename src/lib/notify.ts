let permissionPromptAttempted = false;

/**
 * Ask for notification permission once only, triggered by user interaction (Start click).
 * Never asks again if user denied, dismissed, or already decided.
 */
export async function requestNotificationPermissionOnce(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  if (permissionPromptAttempted) {
    return Notification.permission;
  }

  permissionPromptAttempted = true;

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

/**
 * Reset prompt attempted state (mainly for unit tests).
 */
export function resetNotificationPromptState(): void {
  permissionPromptAttempted = false;
}

/**
 * Shows desktop notification if permission is granted AND document is currently hidden.
 */
export function showTimerNotification(title: string, body: string): Notification | null {
  if (
    typeof window === 'undefined' ||
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return null;
  }

  // Only show notification if the user is in another tab/window
  if (typeof document !== 'undefined' && !document.hidden) {
    return null;
  }

  try {
    return new Notification(title, {
      body,
      silent: true, // Chime handles audio
    });
  } catch {
    return null;
  }
}
