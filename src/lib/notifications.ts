
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Notification } from '@/types';

/**
 * Creates a notification for a specific user.
 * @param userId The ID of the user to notify.
 * @param notification The notification data.
 */
export async function createNotification(userId: string, notification: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>): Promise<void> {
  if (!userId) {
    console.error("Cannot create notification for an unknown user.");
    return;
  }

  try {
    const notificationData: Omit<Notification, 'id'> = {
      ...notification,
      userId: userId,
      createdAt: serverTimestamp(),
      read: false,
    };
    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error("Error creating notification:", error);
    // In a production app, you might want more robust error handling or logging.
  }
}
