
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './use-auth';
import { getUserProfile } from '@/services/userService';
import type { UserProfile } from '@/lib/types';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/dashboard'); // Not an admin, redirect to regular dashboard
        }
      } catch (error) {
        console.error("Failed to check admin status", error);
        setIsAdmin(false);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, router]);

  return { isAdmin, loading };
}
