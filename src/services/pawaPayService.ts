
'use server';

import { v4 as uuidv4 } from 'uuid';
import type { OmitIdTicket } from '@/lib/types';
import { addTicket, getTicketById, updateTicket } from '@/services/ticketService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripUndefined } from '@/lib/utils';


// --- TYPE DEFINITIONS ---

export interface PawaPayProvider {
    provider: string;
    displayName: string;
    logo: string;
    status: 'OPERATIONAL' | 'CLOSED';
    minAmount: number;
    maxAmount: number;
    decimalsInAmount: number;
}

export interface PawaPayCountryConfig {
    prefix: string;
    flag: string;
    currency: string;
    providers: PawaPayProvider[];
}

// --- API CONFIGURATION ---

const PAWAPAY_BASE_URL = "https://api.sandbox.pawapay.io";
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN;


// --- SERVER ACTIONS ---

/**
 * Fetches the active payment configuration for Malawi.
 */
export const getCountryConfig = async (countryCode: 'MWI'): Promise<PawaPayCountryConfig | null> => {
    if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        throw new Error("Payment service is not configured.");
    }
    try {
        const response = await fetch(`${PAWAPAY_BASE_URL}/v2/active-conf?country=${countryCode}&operationType=DEPOSIT`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${PAWAPAY_API_TOKEN}` }
        });

        if (!response.ok) {
            console.error("pawaPay active-conf Error:", await response.text());
            throw new Error('Failed to fetch pawaPay configuration.');
        }

        const data = await response.json();
        const countryData = data.countries.find((c: any) => c.country === countryCode);
        
        if (countryData) {
            return {
                prefix: countryData.prefix,
                flag: countryData.flag,
                currency: countryData.providers[0]?.currencies[0]?.currency || 'MWK',
                providers: countryData.providers.map((p: any) => {
                    const depositInfo = p.currencies[0]?.operationTypes?.DEPOSIT;
                    return {
                        provider: p.provider,
                        displayName: p.displayName,
                        logo: p.logo,
                        status: depositInfo?.status || 'CLOSED',
                        minAmount: parseFloat(depositInfo?.minAmount) || 0,
                        maxAmount: parseFloat(depositInfo?.maxAmount) || Infinity,
                        decimalsInAmount: parseInt(depositInfo?.decimalsInAmount, 10) || 0,
                    };
                }),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching pawaPay providers:", error);
        throw error;
    }
}

/**
 * Initiates a deposit for a plan upgrade.
 */
export const initiatePlanUpgradeDeposit = async (payload: {
    amount: string;
    currency: string;
    country: 'MWI';
    correspondent: string;
    customerPhone: string;
    statementDescription: string;
    userId: string;
    planId: string;
}) => {
     if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        return { success: false, message: "Payment service is not configured." };
    }
    
    try {
        const depositId = uuidv4().toUpperCase();
        const requestBody = {
            depositId,
            amount: payload.amount,
            currency: payload.currency,
            country: payload.country,
            correspondent: payload.correspondent,
            payer: { type: "MSISDN", address: { value: payload.customerPhone } },
            customerTimestamp: new Date().toISOString(),
            statementDescription: payload.statementDescription,
            metadata: {
                type: 'plan_upgrade',
                userId: payload.userId,
                planId: payload.planId,
            }
        };

        const response = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error("PawaPay API Error (Plan Upgrade):", responseData);
            return { success: false, message: responseData.errorMessage || "Failed to initiate payment." };
        }
        
        return { success: true, message: "Payment initiated.", depositId };

    } catch (error) {
        console.error("Error in initiatePlanUpgradeDeposit:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
};

/**
 * Initiates a PawaPay deposit for a ticket purchase.
 * It now creates a temporary ticket in Firestore first.
 */
export const initiateTicketDeposit = async (payload: {
    amount: string;
    currency: string;
    country: 'MWI';
    correspondent: string;
    customerPhone: string;
    statementDescription: string;
    ticketData: Omit<OmitIdTicket, 'pin' | 'status' | 'paymentStatus'>;
}) => {
    if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        return { success: false, message: "Payment service is not configured." };
    }

    try {
        const depositId = uuidv4().toUpperCase();
        const ticketId = uuidv4().toUpperCase();
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        // Step 1: Create temporary ticket in Firestore with PENDING status
        const tempTicket: OmitIdTicket & { id: string } = {
            id: ticketId,
            pin: pin,
            ...payload.ticketData,
            status: 'active', // Is active but unusable until confirmed
            paymentStatus: 'pending',
        };

        const ticketDocRef = doc(db, 'tickets', ticketId);
        await setDoc(ticketDocRef, stripUndefined(tempTicket));

        // Step 2: Prepare and send request to PawaPay
        const requestBody = {
            depositId,
            amount: payload.amount,
            currency: payload.currency,
            country: payload.country,
            correspondent: payload.correspondent,
            payer: { type: "MSISDN", address: { value: payload.customerPhone } },
            customerTimestamp: new Date().toISOString(),
            statementDescription: payload.statementDescription,
            metadata: {
                type: 'ticket_purchase',
                ticketId: ticketId,
                pin: pin, // Pass pin in metadata to be available on success
            }
        };

        const response = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        if (!response.ok) {
            console.error("PawaPay API Error (Ticket Purchase):", responseData);
            return { success: false, message: responseData.errorMessage || "Failed to initiate payment." };
        }

        return { success: true, message: "Payment initiated.", depositId };

    } catch (error) {
        console.error("Error in initiateTicketDeposit:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
};

/**
 * Checks the status of a deposit transaction.
 */
export const checkDepositStatus = async (depositId: string): Promise<{ status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REJECTED', deposit?: any }> => {
    if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        throw new Error("Payment service is not configured.");
    }
    try {
        const response = await fetch(`${PAWAPAY_BASE_URL}/deposits/${depositId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${PAWAPAY_API_TOKEN}` }
        });

        if (!response.ok) {
            console.error("pawaPay check status Error:", await response.text());
            throw new Error('Failed to fetch pawaPay transaction status.');
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            return { status: data[0].status, deposit: data[0] };
        }
        
        return { status: 'PENDING' };

    } catch (error) {
        console.error("Error fetching deposit status:", error);
        throw error;
    }
};
