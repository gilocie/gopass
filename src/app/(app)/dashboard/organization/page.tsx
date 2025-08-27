
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Organizer, UserProfile } from '@/lib/types';
import { getOrganizersByUserId, deleteOrganizer } from '@/services/organizerService';
import { OrganizerCard } from '@/components/organizer-card';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrganizationHubPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizers, setOrganizers] = React.useState<Organizer[]>([]);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOrganizers = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [orgs, profile] = await Promise.all([
          getOrganizersByUserId(user.uid),
          getUserProfile(user.uid)
        ]);
        setOrganizers(orgs);
        setUserProfile(profile);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your organization pages.' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizers();
  }, [user, toast]);

  const handleDeleteOrganizer = async (organizerId: string) => {
    const originalOrganizers = [...organizers];
    setOrganizers(organizers.filter(org => org.id !== organizerId)); // Optimistic delete
    try {
      await deleteOrganizer(organizerId);
      toast({ title: 'Organization Deleted', description: 'The organization page has been successfully removed.' });
    } catch (error) {
      setOrganizers(originalOrganizers); // Revert on error
      toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete the organization page.' });
    }
  };

  const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
  const canCreateOrganization = isFinite(currentPlan.limits.maxOrganizations) 
    ? organizers.length < currentPlan.limits.maxOrganizations 
    : true;


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">My Organization Pages</h1>
          <p className="text-sm text-muted-foreground">Manage all your brands and public profiles from here.</p>
        </div>
        <div className="ml-auto">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!canCreateOrganization}>
            <Link href="/dashboard/organization/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Page
            </Link>
          </Button>
        </div>
      </div>
       {!canCreateOrganization && (
        <Alert variant="destructive">
            <AlertTitle>Organization Limit Reached</AlertTitle>
            <AlertDescription>
                You have reached the maximum number of organization pages for the {currentPlan.name} plan. Please <Link href="/pricing" className="underline font-semibold">upgrade your plan</Link> to create more.
            </AlertDescription>
        </Alert>
       )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : organizers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizers.map(org => (
            <OrganizerCard key={org.id} organizer={org} onDelete={() => handleDeleteOrganizer(org.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No organization pages yet</h3>
          <p className="text-muted-foreground mt-2">Click "Create New Page" to set up your first public profile.</p>
        </div>
      )}
    </div>
  );
}

    