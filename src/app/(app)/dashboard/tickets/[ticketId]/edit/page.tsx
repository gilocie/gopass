
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2, PlusCircle, ArrowLeft, Palette } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import type { Ticket, Benefit } from '@/lib/types';
import { getTicketById, updateTicket } from '@/services/ticketService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageCropper } from '@/components/image-cropper';

const participantTitles = [
    "Participant", "Trainer", "Pastor", "Guest of Honour", 
    "Player", "Comedian", "Artist", "Actor", 
    "Trainee", "Panelist", "Speaker", "VIP"
];

export default function EditTicketPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const ticketId = params.ticketId as string;

    const [ticket, setTicket] = React.useState<Ticket | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isUpdating, setIsUpdating] = React.useState(false);

    // Form state
    const [fullName, setFullName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [holderTitle, setHolderTitle] = React.useState('Participant');
    const [photoUrl, setPhotoUrl] = React.useState('');
    const [ticketType, setTicketType] = React.useState('');
    const [benefits, setBenefits] = React.useState<Benefit[]>([]);
    const [newBenefit, setNewBenefit] = React.useState('');
    
    // Cropper State
    const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = React.useState(false);

    React.useEffect(() => {
        if (!ticketId) return;

        const fetchTicket = async () => {
            try {
                setLoading(true);
                const fetchedTicket = await getTicketById(ticketId);
                if (fetchedTicket) {
                    setTicket(fetchedTicket);
                    setFullName(fetchedTicket.holderName);
                    setEmail(fetchedTicket.holderEmail);
                    setHolderTitle(fetchedTicket.holderTitle || 'Participant');
                    setPhotoUrl(fetchedTicket.holderPhotoUrl || '');
                    setTicketType(fetchedTicket.ticketType);
                    setBenefits(fetchedTicket.benefits);
                } else {
                    toast({ variant: "destructive", title: "Not Found", description: "Ticket could not be found." });
                    router.back();
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to fetch ticket details." });
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [ticketId, router, toast]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageToCrop(event.target?.result as string);
                setIsCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddBenefit = () => {
        if (newBenefit.trim()) {
            // Note: Adding benefits manually like this won't be tied to event pricing.
            // This is a simplified implementation.
            setBenefits([...benefits, { id: `manual_${Date.now()}`, name: newBenefit.trim(), used: false, days: [] }]);
            setNewBenefit('');
        }
    };

    const handleRemoveBenefit = (index: number) => {
        setBenefits(benefits.filter((_, i) => i !== index));
    };

    const handleUpdateTicket = async () => {
        if (!fullName || !email) {
            toast({ variant: "destructive", title: "Missing Information", description: "Full name and email are required." });
            return;
        }

        setIsUpdating(true);
        
        const updatedData: Partial<Ticket> = {
            holderName: fullName,
            holderEmail: email,
            holderTitle,
            holderPhotoUrl: photoUrl,
            ticketType,
            benefits,
        };

        try {
            await updateTicket(ticketId, updatedData);
            toast({ title: "Success", description: "Participant details have been updated." });
            router.back();
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes. Please try again." });
        } finally {
            setIsUpdating(false);
        }
    };
    
    if (loading || !ticket) {
        return <div className="flex items-center justify-center h-full">Loading participant details...</div>
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Edit Participant</h1>
                    <p className="text-sm text-muted-foreground">Make changes to the participant's ticket information.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Participant Details</CardTitle>
                    <CardDescription>Update the name, email, and photo for this participant.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                     <div className="grid gap-4">
                        <Label>Participant's Photo</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={photoUrl} alt={fullName} data-ai-hint="person face" />
                                <AvatarFallback>{fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1.5 flex-grow">
                                <Input id="photo" type="file" onChange={handlePhotoChange} accept="image/*" className="text-sm file:text-xs" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     <div className="grid gap-1.5">
                        <Label htmlFor="holder-title">Participant Title</Label>
                        <div className="flex items-center gap-2">
                             <Select value={holderTitle} onValueChange={(value) => setHolderTitle(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a title" />
                                </SelectTrigger>
                                <SelectContent>
                                    {participantTitles.map(title => (
                                        <SelectItem key={title} value={title}>{title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input id="holder-title" placeholder="Or type a custom title" value={holderTitle} onChange={(e) => setHolderTitle(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Ticket Information</CardTitle>
                    <CardDescription>Adjust the ticket type and the benefits assigned.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                     <div className="grid gap-1.5">
                        <Label htmlFor="ticket-type">Ticket Type</Label>
                        <Input id="ticket-type" value={ticketType} onChange={(e) => setTicketType(e.target.value)} />
                    </div>
                    <Separator />
                    <div className="grid gap-1.5">
                        <Label>Benefits</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input readOnly value={benefit.name} className="flex-grow h-9 text-sm" />
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleRemoveBenefit(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Add a new benefit" value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} className="h-10 text-sm" />
                            <Button size="icon" className="h-10 w-10" onClick={handleAddBenefit}><PlusCircle className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid gap-1.5">
                        <Label>Ticket Design</Label>
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/designer?eventId=${ticket.eventId}&ticketId=${ticket.id}`}>
                                <Palette className="mr-2 h-4 w-4" />
                                Customize Ticket Design
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={handleUpdateTicket} disabled={isUpdating} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
            {imageToCrop && (
                <ImageCropper
                    isOpen={isCropperOpen}
                    onClose={() => {
                        setIsCropperOpen(false);
                        setImageToCrop(null);
                    }}
                    imageSrc={imageToCrop}
                    onCropComplete={(croppedImageUrl) => {
                        setPhotoUrl(croppedImageUrl);
                        setIsCropperOpen(false);
                        setImageToCrop(null);
                    }}
                />
            )}
        </div>
    );
}
