
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, PowerOff, Power } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Organizer } from '@/lib/types';
import { Badge } from './ui/badge';
import { updateOrganizer } from '@/services/organizerService';
import { useToast } from '@/hooks/use-toast';


interface OrganizerCardProps {
  organizer: Organizer;
  onDelete: () => void;
}

export const OrganizerCard = ({ organizer, onDelete }: OrganizerCardProps) => {
    const { toast } = useToast();
    const [isActive, setIsActive] = React.useState(organizer.isActive);

    const handleToggleActive = async () => {
        const newStatus = !isActive;
        try {
            await updateOrganizer(organizer.id, { isActive: newStatus });
            setIsActive(newStatus);
            toast({
                title: `Page ${newStatus ? 'Activated' : 'Deactivated'}`,
                description: `"${organizer.name}" is now ${newStatus ? 'visible' : 'hidden'}.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the page status.',
            });
        }
    };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={organizer.logoUrl || undefined} alt={`${organizer.name} logo`} data-ai-hint="organization logo" />
          <AvatarFallback>{organizer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="truncate">{organizer.name}</CardTitle>
          <CardDescription className="truncate">{organizer.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="flex-1">
                <Link href={`/organizer/${organizer.id}`}><Eye className="mr-2 h-4 w-4" />View Page</Link>
            </Button>
            <Button asChild className="flex-1">
                <Link href={`/dashboard/organization/${organizer.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleToggleActive}>
                        {isActive ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                        {isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the organization page for "{organizer.name}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </CardContent>
      <CardFooter>
        <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </CardFooter>
    </Card>
  );
};
