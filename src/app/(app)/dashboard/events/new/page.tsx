
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Crown, Clock, Sparkles, PlusCircle, Trash2, Info } from 'lucide-react';
import type { OmitIdEvent, Organizer, EventBenefit, UserProfile } from '@/lib/types';
import { addEvent } from '@/services/eventService';
import { Banner } from '@/components/ui/banner';
import { generateEventDescription } from '@/ai/flows/generate-event-details';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { getOrganizersByUserId } from '@/services/organizerService';
import { Checkbox } from '@/components/ui/checkbox';
import { currencies } from '@/lib/currency';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';


export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [organizers, setOrganizers] = React.useState<Organizer[]>([]);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [selectedOrganizerId, setSelectedOrganizerId] = React.useState('');
  const [eventName, setEventName] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [eventCountry, setEventCountry] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [isPaid, setIsPaid] = React.useState(false);
  const [price, setPrice] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [benefits, setBenefits] = React.useState<Omit<EventBenefit, 'id' | 'price'> & { id?: string, price: string }[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const [userOrgs, profile] = await Promise.all([
            getOrganizersByUserId(user.uid),
            getUserProfile(user.uid)
          ]);

          setOrganizers(userOrgs);
          setUserProfile(profile);

          if (userOrgs.length === 1) {
            setSelectedOrganizerId(userOrgs[0].id);
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch initial data.' });
        }
      }
    };
    fetchUserData();
  }, [user, toast]);

  const handleBenefitChange = (index: number, field: keyof EventBenefit, value: string | number | number[] | undefined) => {
    const newBenefits = [...benefits];
    (newBenefits[index] as any)[field] = value;
    setBenefits(newBenefits);
  };
  
  const handleBenefitDaysChange = (index: number, day: number) => {
    const newBenefits = [...benefits];
    const currentDays = newBenefits[index].days || [];
    if (currentDays.includes(day)) {
        newBenefits[index].days = currentDays.filter(d => d !== day);
    } else {
        newBenefits[index].days = [...currentDays, day];
    }
    setBenefits(newBenefits);
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, { name: '', price: '0', days: [] }]);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleCreateEvent = async () => {
    if (!eventName || !eventDescription || !eventLocation || !eventCountry || !startDate || !startTime || !selectedOrganizerId) {
        toast({
            variant: "destructive",
            title: "Incomplete Form",
            description: "Please fill out all required fields, including selecting an organizer.",
        });
        return;
    }
    
    if (!user || !userProfile) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create an event."});
        return;
    }

    setIsCreating(true);

    try {
        const basePrice = isPaid ? parseFloat(price) : 0;
        const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
        
        const trainingBenefit: EventBenefit = {
            id: 'benefit_training',
            name: 'Training',
            price: basePrice,
            days: Array.from({ length: totalDays }, (_, i) => i + 1), 
        };

        const customBenefits: EventBenefit[] = benefits.map((b) => {
            const benefit: EventBenefit = {
                id: `benefit_${uuidv4()}`,
                name: b.name,
                price: parseFloat(b.price) || 0,
                days: b.days || [],
            };
            if (b.startTime) benefit.startTime = b.startTime;
            if (b.endTime) benefit.endTime = b.endTime;
            return benefit;
        });
        
        const allBenefits: EventBenefit[] = [trainingBenefit, ...customBenefits];
        
        const currentPlan = PLANS[userProfile.planId] || PLANS['hobby'];
        const ticketsTotal = currentPlan.limits.maxTicketsPerEvent;

        const eventData: OmitIdEvent = {
            name: eventName,
            description: eventDescription,
            location: eventLocation,
            country: eventCountry,
            startDate: startDate.toISOString(),
            startTime: startTime,
            endTime: endTime,
            isPaid: isPaid,
            price: basePrice,
            currency: isPaid ? currency : 'USD',
            status: 'draft',
            ticketsIssued: 0,
            ticketsTotal: ticketsTotal,
            organizerId: selectedOrganizerId,
            isPublished: false,
            bannerUrl: bannerUrl || '',
            benefits: allBenefits,
        };

        if (endDate) {
            eventData.endDate = endDate.toISOString();
        }

        await addEvent(eventData);
        
        toast({
            title: "Event Created!",
            description: "Your new event has been successfully created as a draft.",
        });
        router.push('/dashboard/events');

    } catch (error) {
        console.error("Event creation error:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create event. Please try again.",
        });
    } finally {
        setIsCreating(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!eventName) {
        toast({
            variant: "destructive",
            title: "Event Name Required",
            description: "Please enter an event name first to generate a description.",
        });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generateEventDescription({ eventName });
        setEventDescription(result.description);
    } catch(error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Could not generate an event description. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
  const canAddBenefits = isFinite(currentPlan.limits.maxBenefits) 
      ? benefits.length < (currentPlan.limits.maxBenefits -1) 
      : true;

  const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
  if(startDate && !endDate) {
      const tempEndDate = new Date(startDate);
      tempEndDate.setHours(23, 59, 59, 999);
      if(tempEndDate.getTime() > startDate.getTime()) {
      }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Create a New Event</h1>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Event Banner</CardTitle>
                <CardDescription>Upload a banner image for your event. Max 2MB.</CardDescription>
            </CardHeader>
            <CardContent>
                <Banner onImageChange={setBannerUrl} />
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill in the information for your event.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="grid gap-2">
                <Label htmlFor="organizer">Organizer</Label>
                 <Select value={selectedOrganizerId} onValueChange={setSelectedOrganizerId} disabled={organizers.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an organizer profile..." />
                    </SelectTrigger>
                    <SelectContent>
                        {organizers.length > 0 ? (
                            organizers.map(org => (
                                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))
                        ) : (
                            <SelectItem value="none" disabled>No organizer profiles found. Please create one first.</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                 {organizers.length === 0 && (
                    <p className="text-xs text-muted-foreground">You must have an organizer profile to create an event. <Link href="/dashboard/organization/new" className="underline text-primary">Create one now</Link>.</p>
                 )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input id="event-name" placeholder="e.g., Annual Tech Summit" value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="event-description">Event Description</Label>
                    <Button variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                </div>
                <WysiwygEditor value={eventDescription} onChange={setEventDescription} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="event-location">Event Location</Label>
                    <Input id="event-location" placeholder="e.g., San Francisco, CA" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="event-country">Country</Label>
                    <Input id="event-country" placeholder="e.g., USA" value={eventCountry} onChange={(e) => setEventCountry(e.target.value)} />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="relative">
                  <Input
                    id="start-time"
                    type="time"
                    className="w-full pr-10"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="Pick a time"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                 <div className="relative">
                   <Input
                    id="end-time"
                    type="time"
                    className="w-full pr-10"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Pick a time"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
             <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                    <Switch id="is-paid" checked={isPaid} onCheckedChange={setIsPaid} />
                    <Label htmlFor="is-paid" className="flex items-center gap-2">
                        This is a paid event
                        {isPaid && <Crown className="h-4 w-4 text-yellow-500" />}
                    </Label>
                </div>
                {isPaid && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                      <div className="md:col-span-2 grid gap-2">
                          <Label htmlFor="event-price">Training Price</Label>
                          <Input id="event-price" type="number" placeholder="25.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                      </div>
                       <div className="grid gap-2">
                          <Label htmlFor="event-currency">Currency</Label>
                           <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(currencies).map(c => (
                                        <SelectItem key={c.code} value={c.code}>{c.code} ({c.name})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                      </div>
                  </div>
                )}
            </div>
             <div>
                <Label className="flex items-center gap-2">Event Benefits (Add-ons)</Label>
                <p className="text-xs text-muted-foreground mb-2 flex items-start gap-2"><Info className="h-4 w-4 shrink-0 mt-0.5" />The base 'Training' price is automatically included as a default benefit for all tickets.</p>
                {!canAddBenefits && (
                     <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Benefit Limit Reached</AlertTitle>
                        <AlertDescription>
                            You have reached the maximum of {currentPlan.limits.maxBenefits} benefits for the {currentPlan.name} plan. <Link href="/pricing" className="underline font-semibold">Upgrade</Link> to add more.
                        </AlertDescription>
                    </Alert>
                )}
              <div className="space-y-4 mt-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive" onClick={() => handleRemoveBenefit(index)}><Trash2 className="h-4 w-4"/></Button>
                    <div className="sm:col-span-2 md:col-span-1 grid gap-2">
                      <Label htmlFor={`benefit-name-${index}`}>Name</Label>
                      <Input id={`benefit-name-${index}`} value={benefit.name} onChange={(e) => handleBenefitChange(index, 'name', e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor={`benefit-price-${index}`}>Price ({currency})</Label>
                      <Input id={`benefit-price-${index}`} type="number" value={benefit.price} onChange={(e) => handleBenefitChange(index, 'price', e.target.value)} />
                    </div>
                    <div className="sm:col-span-3 grid gap-2">
                        <Label>Claim Day(s)</Label>
                        <div className="flex flex-wrap items-center gap-4">
                            {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => (
                                <div key={dayNum} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`benefit-${index}-day-${dayNum}`}
                                        checked={(benefit.days || []).includes(dayNum)}
                                        onCheckedChange={() => handleBenefitDaysChange(index, dayNum)}
                                    />
                                    <label htmlFor={`benefit-${index}-day-${dayNum}`} className="text-sm font-medium leading-none">
                                        Day {dayNum}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                        <Label htmlFor={`benefit-start-${index}`}>Start Time (Optional)</Label>
                        <Input id={`benefit-start-${index}`} type="time" value={benefit.startTime || ''} onChange={(e) => handleBenefitChange(index, 'startTime', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor={`benefit-end-${index}`}>End Time (Optional)</Label>
                        <Input id={`benefit-end-${index}`} type="time" value={benefit.endTime || ''} onChange={(e) => handleBenefitChange(index, 'endTime', e.target.value)} />
                        </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={handleAddBenefit} disabled={!canAddBenefits}><PlusCircle className="mr-2 h-4 w-4" /> Add Benefit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
            <Link href="/dashboard/events">Cancel</Link>
        </Button>
        <Button onClick={handleCreateEvent} disabled={isCreating || organizers.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isCreating ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}
