'use server';

import { v4 as uuidv4 } from 'uuid';
import type { OmitIdTicket } from '@/lib/types';
import { addTicket, updateTicket } from './ticketService';

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

interface TicketDepositPayload {
    amount: string;
    correspondent: string;
    customerPhone: string;
    statementDescription: string;
    ticketData: Omit<OmitIdTicket, 'pin'>;
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
 * Initiates a PawaPay deposit for a ticket purchase.
 * It first creates a temporary ticket in Firestore, then initiates payment.
 */
export const initiateTicketDeposit = async (payload: TicketDepositPayload): Promise<{ success: boolean; message: string; depositId?: string, ticketId?: string, pin?: string }> => {
    if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        return { success: false, message: "Payment service is not configured." };
    }

    try {
        // Step 1: Create the ticket in Firestore with PENDING status
        const { ticketId, pin } = await addTicket(payload.ticketData);
        
        // Step 2: Construct the payload for PawaPay (FOR DEBUGGING)
        const formattedAmount = parseFloat(payload.amount).toFixed(2);
        const countryPrefix = (await getCountryConfig('MWI'))?.prefix || '265';
        
        const requestBody = {
            amount: formattedAmount,
            currency: "MWK",
            country: "MWI",
            correspondent: payload.correspondent,
            payer: {
                type: "MSISDN",
                address: { value: `${countryPrefix}${payload.customerPhone.replace(/^0+/, '')}` }
            },
            customerTimestamp: new Date().toISOString(),
            statementDescription: payload.statementDescription.substring(0, 25),
        };
        
        // Step 3: Log the payload to the server console
        console.log("--- PAWAPAY TICKET DEPOSIT PAYLOAD (DEBUG) ---");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("----------------------------------------------");

        // Step 4: Immediately update the ticket status to 'completed'
        await updateTicket(ticketId, { paymentStatus: 'completed' });

        // Step 5: Return success to the client
        return { success: true, message: "Debug successful. Ticket marked as complete.", ticketId, pin };

    } catch (error) {
        console.error("Error in initiateTicketDeposit (Debug Mode):", error);
        return { success: false, message: "An unexpected server error occurred during the debug process." };
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
