
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
import { useRouter, useParams } from 'next/navigation';
import { Crown, Clock, PlusCircle, Trash2 } from 'lucide-react';
import type { OmitIdEvent, Event, EventBenefit, UserProfile } from '@/lib/types';
import { getEventById, updateEvent } from '@/services/eventService';
import { Banner } from '@/components/ui/banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { currencies } from '@/lib/currency';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';
import { PLANS } from '@/lib/plans';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { v4 as uuidv4 } from 'uuid';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';

export default function EditEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const eventId = params.eventId as string;
  const { user } = useAuth();

  const [event, setEvent] = React.useState<Event | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

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
  const [benefits, setBenefits] = React.useState<EventBenefit[]>([]);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
        if (!eventId || !user) return;
        setLoading(true);
        try {
            const [fetchedEvent, profile] = await Promise.all([
                getEventById(eventId),
                getUserProfile(user.uid)
            ]);

            setUserProfile(profile);

            if (fetchedEvent) {
                setEvent(fetchedEvent);
                setEventName(fetchedEvent.name);
                setEventDescription(fetchedEvent.description);
                setEventLocation(fetchedEvent.location);
                setEventCountry(fetchedEvent.country);
                setStartDate(new Date(fetchedEvent.startDate));
                setEndDate(fetchedEvent.endDate ? new Date(fetchedEvent.endDate) : undefined);
                setStartTime(fetchedEvent.startTime || '');
                setEndTime(fetchedEvent.endTime || '');
                setIsPaid(fetchedEvent.isPaid);
                setPrice(String(fetchedEvent.price));
                setCurrency(fetchedEvent.currency || 'USD');
                setBannerUrl(fetchedEvent.bannerUrl || null);
                setBenefits(fetchedEvent.benefits || []);
            } else {
                 toast({ variant: "destructive", title: "Error", description: "Event not found." });
                 router.push('/dashboard/events');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch event details." });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [eventId, user, toast, router]);

  const handleBenefitChange = (index: number, field: keyof EventBenefit, value: string | number | number[] | undefined) => {
    const newBenefits = [...benefits];
    const benefitToUpdate = { ...newBenefits[index] };
    (benefitToUpdate as any)[field] = value;
    newBenefits[index] = benefitToUpdate;
    setBenefits(newBenefits);
  };
  
  const handleBenefitDaysChange = (index: number, day: number) => {
    const newBenefits = [...benefits];
    const benefitToUpdate = { ...newBenefits[index] };
    const currentDays = benefitToUpdate.days || [];
    if (currentDays.includes(day)) {
        benefitToUpdate.days = currentDays.filter(d => d !== day);
    } else {
        benefitToUpdate.days = [...currentDays, day];
    }
    newBenefits[index] = benefitToUpdate;
    setBenefits(newBenefits);
  };

  const handleAddBenefit = () => {
    setBenefits([...benefits, { id: `benefit_${uuidv4()}`, name: '', price: 0, days: [] }]);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleUpdateEvent = async () => {
    if (!eventId) {
        toast({ variant: "destructive", title: "Error", description: "Event ID is missing." });
        return;
    }
    if (!eventName || !eventDescription || !eventLocation || !eventCountry || !startDate || !startTime) {
        toast({
            variant: "destructive",
            title: "Incomplete Form",
            description: "Please fill out all required fields to update the event.",
        });
        return;
    }
    
    setIsUpdating(true);
    
    const basePrice = isPaid ? parseFloat(price) : 0;
    const trainingBenefitIndex = benefits.findIndex(b => b.id === 'benefit_training');
    const updatedBenefits = [...benefits];
    if (trainingBenefitIndex > -1) {
        updatedBenefits[trainingBenefitIndex].price = basePrice;
    }


    const updatedEvent: Partial<OmitIdEvent> = {
        name: eventName,
        description: eventDescription,
        location: eventLocation,
        country: eventCountry,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        startTime: startTime,
        endTime: endTime,
        isPaid: isPaid,
        price: basePrice,
        currency: isPaid ? currency : 'USD',
        bannerUrl: bannerUrl || '',
        benefits: updatedBenefits,
    };

    try {
        await updateEvent(eventId, updatedEvent);
        toast({
            title: "Event Updated!",
            description: "Your event has been successfully updated.",
        });
        router.push('/dashboard/events');
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update event. Please try again.",
        });
    } finally {
        setIsUpdating(false);
    }
  };
  
  const currentPlan = userProfile?.planId ? PLANS[userProfile.planId] : PLANS['hobby'];
  const canAddBenefits = isFinite(currentPlan.limits.maxBenefits) 
      ? benefits.filter(b => b.id !== 'benefit_training').length < (currentPlan.limits.maxBenefits -1)
      : true;

  if (loading) {
      return <div>Loading event details...</div>
  }

  const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Edit Event</h1>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Event Banner</CardTitle>
                <CardDescription>Upload a new banner image to replace the old one. Max 2MB.</CardDescription>
            </CardHeader>
            <CardContent>
                <Banner initialImage={bannerUrl} onImageChange={setBannerUrl} />
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Update the information for your event.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input id="event-name" placeholder="e.g., Annual Tech Summit" value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">Event Description</Label>
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
              <Label>Event Benefits (Add-ons)</Label>
               {!canAddBenefits && (
                     <Alert variant="destructive" className="my-2">
                        <AlertTitle>Benefit Limit Reached</AlertTitle>
                        <AlertDescription>
                            You have reached the maximum of {currentPlan.limits.maxBenefits} benefits for the {currentPlan.name} plan. <Link href="/pricing" className="underline font-semibold">Upgrade</Link> to add more.
                        </AlertDescription>
                    </Alert>
                )}
              <div className="space-y-4 mt-2">
                {benefits.filter(b => b.id !== 'benefit_training').map((benefit, index) => {
                  const actualIndex = benefits.findIndex(b => b.id === benefit.id);
                  return (
                  <div key={benefit.id} className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive" onClick={() => handleRemoveBenefit(actualIndex)}><Trash2 className="h-4 w-4"/></Button>
                    <div className="sm:col-span-2 md:col-span-1 grid gap-2">
                      <Label htmlFor={`benefit-name-${actualIndex}`}>Name</Label>
                      <Input id={`benefit-name-${actualIndex}`} value={benefit.name} onChange={(e) => handleBenefitChange(actualIndex, 'name', e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor={`benefit-price-${actualIndex}`}>Price ({currency})</Label>
                      <Input id={`benefit-price-${actualIndex}`} type="number" value={benefit.price} onChange={(e) => handleBenefitChange(actualIndex, 'price', parseFloat(e.target.value))} />
                    </div>
                     <div className="sm:col-span-3 grid gap-2">
                        <Label>Claim Day(s)</Label>
                        <div className="flex flex-wrap items-center gap-4">
                            {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => (
                                <div key={dayNum} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`benefit-${actualIndex}-day-${dayNum}`}
                                        checked={(benefit.days || []).includes(dayNum)}
                                        onCheckedChange={() => handleBenefitDaysChange(actualIndex, dayNum)}
                                    />
                                    <label htmlFor={`benefit-${actualIndex}-day-${dayNum}`} className="text-sm font-medium leading-none">
                                        Day {dayNum}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                        <Label htmlFor={`benefit-start-${actualIndex}`}>Start Time (Optional)</Label>
                        <Input id={`benefit-start-${actualIndex}`} type="time" value={benefit.startTime || ''} onChange={(e) => handleBenefitChange(actualIndex, 'startTime', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor={`benefit-end-${actualIndex}`}>End Time (Optional)</Label>
                        <Input id={`benefit-end-${actualIndex}`} type="time" value={benefit.endTime || ''} onChange={(e) => handleBenefitChange(actualIndex, 'endTime', e.target.value)} />
                        </div>
                    </div>
                  </div>
                )})}
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
        <Button onClick={handleUpdateEvent} disabled={isUpdating} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isUpdating ? 'Updating...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
