
      import type { PlanId } from './plans';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    planId: PlanId;
    countryCode?: string; // e.g., 'US', 'MW'
    upgradeHistory?: {
        planId: PlanId;
        date: string; // ISO String
    }[];
    exchangeRates?: { [key: string]: number }; // e.g., { USD: 1750 }
    totalPaidOut?: number;
    isAdmin?: boolean;
}

export interface PayoutRequest {
    id: string;
    userId: string;
    organizerId: string;
    amount: number;
    status: 'pending' | 'approved' | 'denied';
    requestedAt: Timestamp;
    processedAt?: Timestamp;
}

export interface PayoutRequestWithOrganizer extends PayoutRequest {
    organizer?: Organizer;
}

export interface Organizer {
    id: string;
    userId: string;
    name: string;
    description: string;
    logoUrl?: string;
    website?: string;
    bannerUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
    paymentDetails?: {
        wireTransfer?: {
            bankName: string;
            accountNumber: string;
            accountName: string;
            branch?: string;
        };
        mobileMoney?: {
            provider: string;
            phoneNumber: string;
            accountName: string;
        };
    };
}

export type OmitIdOrganizer = Omit<Organizer, 'id'>;

export interface EventBenefit {
    id: string; // e.g., 'benefit_1722888955'
    name: string;
    price: number;
    days: number[]; // Day(s) of the event this benefit can be claimed
    startTime?: string;
    endTime?: string;
}

// Stored design template for an event's tickets
export interface EventTicketTemplate {
    ticketType: string;
    backgroundImageUrl: string;
    backgroundOpacity: number;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontWeight: React.CSSProperties['fontWeight'];
    ticketWidth: number;
    ticketHeight: number;
    backgroundType: 'solid' | 'gradient';
    solidBackgroundColor: string;
    gradientStartColor: string;
    gradientEndColor: string;
    showWatermark: boolean;
}

export interface Event {
    id: string;
    name: string;
    description: string;
    location: string;
    country: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isPaid: boolean;
    price: number;
    currency: string; 
    status: 'upcoming' | 'past' | 'draft' | 'deleted' | 'ongoing';
    deletedAt?: Timestamp;
    ticketsIssued: number;
    ticketsTotal: number;
    bannerUrl?: string;
    organizerId?: string;
    isPublished?: boolean;
    benefits?: EventBenefit[];
    ticketTemplate?: Partial<EventTicketTemplate>;
    createdAt?: Timestamp;
}

export type OmitIdEvent = Omit<Event, 'id'>;

export interface Benefit {
    id: string; // This will now match the EventBenefit ID
    name: string;
    used: boolean;
    startTime?: string;
    endTime?: string;
    days: number[];
    lastUsedDate?: string; // ISO date string
}

export interface Ticket {
    id: string;
    eventId: string;
    holderName: string;
    holderEmail: string;
    holderPhone?: string;
    holderTitle?: string;
    holderPhotoUrl?: string;
    pin: string;
    ticketType: string;
    benefits: Benefit[];
    backgroundImageUrl?: string;
    backgroundImageOpacity?: number;
    status: 'active' | 'cancelled' | 'used';
    createdAt?: Date;
    totalPaid?: number;
    paymentMethod?: 'manual' | 'online';
    paymentStatus?: 'pending' | 'awaiting-confirmation' | 'completed' | 'failed';
    receiptUrl?: string;
}

export type OmitIdTicket = Omit<Ticket, 'id'>;

export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'welcome' | 'event' | 'ticket' | 'scan' | 'benefit' | 'organizer';
    link?: string;
    createdAt: Timestamp;
    isRead: boolean;
}

export interface BrandingSettings {
    siteName?: string;
    logoUrl?: string | null;
    iconUrl?: string | null;
    colors?: {
        primary: string;
        accent: string;
        background: string;
    };
    hero?: {
        title: string;
        subtitle: string;
        backgroundImageUrl?: string | null;
    };
    footer?: {
        copyrightText: string;
    };
    contact?: {
        email: string;
        phone: string;
        address: string;
    };
    lastUpdated?: Timestamp;
}

    