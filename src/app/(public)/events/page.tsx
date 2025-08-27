
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { getEvents } from '@/services/eventService';
import type { Event } from '@/lib/types';
import { PublicEventCard } from '@/components/public-event-card';

export default function EventsPage() {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCountry, setSelectedCountry] = React.useState('all');
    const [selectedLocation, setSelectedLocation] = React.useState('all');

    React.useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const allEvents = await getEvents();
                setEvents(allEvents);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const upcomingEvents = events.filter(e => {
        const eventDate = new Date(e.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isFutureEvent = eventDate >= today;
        const isValidStatus = e.status === 'upcoming'; // No longer show drafts
        const isPublished = e.isPublished === true;
        
        return isFutureEvent && isValidStatus && isPublished;
    });
    
    const uniqueCountries = [...new Set(upcomingEvents.map(event => event.country))].sort();
    
    const locationsInSelectedCountry = selectedCountry !== 'all' 
        ? [...new Set(upcomingEvents.filter(e => e.country === selectedCountry).map(e => e.location))].sort()
        : [];

    const filteredEvents = upcomingEvents.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCountry = selectedCountry !== 'all' ? event.country === selectedCountry : true;
        const matchesLocation = selectedLocation !== 'all' ? event.location === selectedLocation : true;
        return matchesSearch && matchesCountry && matchesLocation;
    });
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold">Event Marketplace</h1>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                    Discover and join amazing events happening around the world.
                </p>
            </div>

            <Card className="my-8">
                <CardContent className="p-4 md:p-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Search events..." 
                                className="pl-10" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <Select value={selectedCountry} onValueChange={value => { setSelectedCountry(value); setSelectedLocation('all'); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by country..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    {uniqueCountries.map(country => (
                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={selectedCountry === 'all'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by location..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locationsInSelectedCountry.map(location => (
                                        <SelectItem key={location} value={location}>{location}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                {loading ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">Loading events...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map(event => (
                            <PublicEventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">
                            No upcoming events found matching your criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
