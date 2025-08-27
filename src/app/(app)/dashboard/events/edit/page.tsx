
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
import { Crown, Clock } from 'lucide-react';
import type { OmitIdEvent, Event } from '@/lib/types';
import { getEventById, updateEvent } from '@/services/eventService';
import { Banner } from '@/components/ui/banner';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';

export default function EditEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = React.useState<Event | null>(null);
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
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    const fetchEvent = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const fetchedEvent = await getEventById(eventId);
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
                setBannerUrl(fetchedEvent.bannerUrl || null);
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
    fetchEvent();
  }, [eventId, toast, router]);


  const handleUpdateEvent = async () => {
    if (!eventName || !eventDescription || !eventLocation || !eventCountry || !startDate || !startTime) {
        toast({
            variant: "destructive",
            title: "Incomplete Form",
            description: "Please fill out all required fields to update the event.",
        });
        return;
    }
    
    setIsUpdating(true);
    
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
        price: isPaid ? parseFloat(price) : 0,
        bannerUrl: bannerUrl || '',
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

  if (loading) {
      return <div>Loading event details...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Edit Event</h1>
      </div>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Event Banner</CardTitle>
                <CardDescription>Upload a new banner image to replace the old one.</CardDescription>
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
                        Sale this event
                        {isPaid && <Crown className="h-4 w-4 text-yellow-500" />}
                    </Label>
                </div>
                {isPaid && (
                  <div className="grid gap-2 animate-in fade-in">
                      <Label htmlFor="event-price">Price (USD)</Label>
                      <Input id="event-price" type="number" placeholder="25.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                )}
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
