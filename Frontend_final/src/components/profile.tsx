'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

interface UserProfile {
  userId: number;
  username: string;
  email: string;
  created_at: string;
}

export function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/profile');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          toast.error('Failed to load profile');
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        toast.error('An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        toast.error('Logout failed');
        return;
      }

      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const createdDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Username</p>
          <p className="text-lg font-semibold">{user.username}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <p className="text-lg font-semibold break-all">{user.email}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">User ID</p>
          <p className="text-lg font-semibold">{user.userId}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Member Since</p>
          <p className="text-lg font-semibold">{createdDate}</p>
        </div>

        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full gap-2"
          variant="outline"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </CardContent>
    </Card>
  );
}
