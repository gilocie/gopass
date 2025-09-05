
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp, updateDoc, doc, writeBatch } from 'firebase/firestore';
import type { Notification } from '@/lib/types';

const getNotificationsCollection = (userId: string) => {
    return collection(db, 'users', userId, 'notifications');
}

// Create a new notification
export const addNotification = async (userId: string, message: string, type: Notification['type'], link?: string) => {
    try {
        const notificationsCollection = getNotificationsCollection(userId);
        await addDoc(notificationsCollection, {
            userId,
            message,
            type,
            link: link || '#',
            createdAt: serverTimestamp(),
            isRead: false,
        });
    } catch (error) {
        console.error("Error adding notification: ", error);
    }
};

// Hook to get real-time notifications for a user
export const useNotifications = (userId: string) => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const notificationsCollection = getNotificationsCollection(userId);
        const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications: Notification[] = [];
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.isRead) {
                    count++;
                }
                fetchedNotifications.push({ id: doc.id, ...data } as Notification);
            });
            setNotifications(fetchedNotifications);
            setUnreadCount(count);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [userId]);

    return { notifications, unreadCount, loading };
}

// Mark notifications as read
export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
    if (notificationIds.length === 0) return;
    try {
        const notificationsCollection = getNotificationsCollection(userId);
        const batch = writeBatch(db);
        notificationIds.forEach(id => {
            const notificationRef = doc(notificationsCollection, id);
            batch.update(notificationRef, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read: ", error);
    }
}
