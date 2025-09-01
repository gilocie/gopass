
'use server';

import { v4 as uuidv4 } from 'uuid';
import type { OmitIdTicket } from '@/lib/types';
import { addTicket, createFinalTicket } from '@/services/ticketService';

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
 * Fetches the active payment configuration for a country.
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
 * Initiates a PawaPay deposit for a ticket purchase.
 * It first creates a temporary ticket in Firestore, then initiates payment.
 */
export const initiateTicketDeposit = async (payload: {
    amount: string;
    currency: 'MWK';
    country: 'MWI';
    correspondent: string;
    customerPhone: string;
    statementDescription: string;
    ticketData: Omit<OmitIdTicket, 'pin'>;
}) => {
    if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        return { success: false, message: "Payment service is not configured." };
    }

    try {
        // Step 1: Create temporary ticket in Firestore with PENDING status
        const { ticketId, pin } = await addTicket(payload.ticketData);
        
        const depositId = uuidv4().toUpperCase();

        // Step 2: Prepare a minimal, clean payload for PawaPay
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
                pin: pin,
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
            // TODO: Optionally delete the pending ticket here if initiation fails
            return { success: false, message: responseData.errorMessage || "Failed to initiate payment." };
        }

        return { success: true, message: "Payment initiated.", depositId };

    } catch (error) {
        console.error("Error in initiateTicketDeposit:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
};

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
