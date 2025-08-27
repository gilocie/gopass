
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Ticket as TicketIcon, Calendar, MapPin, Clock, LogOut } from "lucide-react";
import type { Ticket, Event, UserProfile } from '@/lib/types';
import { format, isSameMonth, isSameYear } from 'date-fns';
import Image from 'next/image';
import { Button } from './ui/button';
import Logo from './logo';
import { cn } from '@/lib/utils';

interface TicketPreviewProps {
    ticket: Ticket;
    event: Event;
    userProfile?: UserProfile | null;
    onExit?: () => void;
}

export const TicketPreview = ({ ticket, event, userProfile, onExit }: TicketPreviewProps) => {
    
    const formatDateRange = (start: Date, end: Date | undefined) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : undefined;
        
        if (endDate && isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
            return `${format(startDate, 'dd')} - ${format(endDate, 'dd')} ${format(startDate, 'MMM, yyyy')}`;
        }
        
        let datePart = format(startDate, 'MMM dd, yyyy');

        if (endDate) {
            datePart = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
        }
        return datePart;
    };

    const eventDate = formatDateRange(new Date(event.startDate), event.endDate ? new Date(event.endDate) : undefined);
    const eventTime = `${event.startTime || ''}${event.endTime ? ` - ${event.endTime}` : ''}`;

    const benefitsUsed = ticket.benefits.filter(b => b.used).length;
    const qrCodeUrl = typeof window !== 'undefined' 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(window.location.origin + '/ticket/' + ticket.id + '?eventId=' + event.id)}`
        : 'https://placehold.co/128x128.png';
        
    // Use event template design if available, otherwise fall back to ticket's own design
    const template = event.ticketTemplate;
    
    const primaryColor = template?.primaryColor || '#ffffff';
    const accentColor = template?.accentColor || '#9D4EDD';
    const fontFamily = template?.fontFamily || 'Inter, sans-serif';
    const fontWeight = template?.fontWeight || 'bold';
    const ticketWidth = template?.ticketWidth || 350;
    const ticketHeight = template?.ticketHeight || 570;
    const backgroundImageUrl = template?.backgroundImageUrl || ticket.backgroundImageUrl || '';
    const backgroundOpacity = template?.backgroundOpacity !== undefined ? template.backgroundOpacity / 100 : (ticket.backgroundImageOpacity || 0.1);
    const showWatermark = template?.showWatermark ?? (userProfile?.planId === 'hobby');

    const backgroundStyle = template?.backgroundType === 'gradient'
      ? { backgroundImage: `linear-gradient(${template.gradientStartColor}, ${template.gradientEndColor})` }
      : { backgroundColor: template?.solidBackgroundColor || '#110d19' };

    const exitButtonGradient = {
      backgroundImage: `linear-gradient(to right, ${template?.gradientStartColor || '#2b1f42'} 0%, ${template?.solidBackgroundColor || '#110d19'} 100%)`
    }
    
    return (
        <div 
            className="w-full max-w-md bg-card rounded-lg flex flex-col p-6 border-4 border-primary/20 relative overflow-hidden text-white" 
            style={{
                fontFamily: fontFamily,
                width: `${ticketWidth}px`,
                height: `${ticketHeight}px`,
                ...backgroundStyle,
                lineHeight: '1.2'
            }}
        >
             {backgroundImageUrl && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={backgroundImageUrl} 
                        alt="background" 
                        className="w-full h-full object-cover"
                        style={{ opacity: backgroundOpacity }}
                        crossOrigin="anonymous"
                    />
                </div>
            )}
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full" style={{backgroundColor: `${accentColor}1A`}} />
            <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full" style={{backgroundColor: `${accentColor}1A`}} />
            
             {showWatermark && (
                <div className="absolute bottom-2 right-2 z-20 opacity-50">
                    <Logo className="text-white/50" />
                </div>
            )}

            <div className="z-10 flex flex-col h-full">
                <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest leading-tight" style={{color: accentColor}}>{event.name}</p>
                    <h2 className="text-2xl mt-2 font-black uppercase tracking-wider leading-tight" style={{ color: primaryColor, fontWeight: fontWeight }}>{ticket.ticketType}</h2>
                </div>
                
                <Separator className="my-6 bg-white/20" />
                
                <div className="flex items-center gap-4 text-left">
                    <Avatar className="h-16 w-16 border-2" style={{borderColor: accentColor + '80'}}>
                        <AvatarImage src={ticket.holderPhotoUrl} alt={ticket.holderName} crossOrigin="anonymous" data-ai-hint="person face" />
                        <AvatarFallback>{ticket.holderName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-white/70 text-xs uppercase tracking-wider leading-tight">{ticket.holderTitle || 'Participant'}</p>
                        <p className="text-xl font-bold uppercase leading-tight" style={{ color: primaryColor }}>{ticket.holderName}</p>
                        <p className="text-sm text-white/70 leading-tight">{ticket.holderEmail}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-1 text-sm text-left">
                    <div className="flex items-center gap-3">
                       <Calendar className="h-4 w-4 text-white/70" />
                       <p className="leading-tight" style={{ color: primaryColor }}>{eventDate}</p>
                    </div>
                    {eventTime.trim() !== '-' && (
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-white/70" />
                            <p className="leading-tight" style={{ color: primaryColor }}>{eventTime}</p>
                        </div>
                    )}
                     <div className="flex items-center gap-3">
                       <MapPin className="h-4 w-4 text-white/70" />
                       <p className="leading-tight" style={{ color: primaryColor }}>{event.location}, {event.country}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <TicketIcon className="h-4 w-4 text-white/70" />
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-base leading-tight" style={{ color: primaryColor }}>{benefitsUsed}/{ticket.benefits.length}</span>
                            <span className="text-xs text-white/70 leading-tight">Benefits Used</span>
                        </div>
                    </div>
                     {onExit && (
                        <div className="pt-2">
                             <Button
                                onClick={onExit}
                                size="sm"
                                className={cn(
                                    "w-full text-white border-white/20 hover:border-white/50",
                                    "bg-gradient-to-r hover:opacity-90 transition-all"
                                )}
                                style={exitButtonGradient}
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Exit
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6">
                    <div className="flex flex-col items-center">
                        <div className="p-2 bg-white rounded-lg">
                            <Image src={qrCodeUrl} alt="QR Code" width={100} height={100} className="h-24 w-24" crossOrigin="anonymous" />
                        </div>
                        <p className="text-xs text-center text-white/70 mt-2 leading-tight">Ticket ID</p>
                        <p className="font-mono text-center leading-tight" style={{ color: primaryColor }}>{ticket.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
