
'use server';

import { v4 as uuidv4 } from 'uuid';

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

interface BaseDepositPayload {
    amount: string;
    currency: string;
    country: 'MWI';
    correspondent: string;
    customerPhone: string;
    statementDescription: string;
}

interface PlanDepositPayload extends BaseDepositPayload {
    metadata: {
        type: 'plan_upgrade';
        userId: string;
        planId: string;
    };
}

interface TicketDepositPayload extends BaseDepositPayload {
    metadata: {
        type: 'ticket_purchase';
        ticketId: string;
    };
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

const createDeposit = async (payload: PlanDepositPayload | TicketDepositPayload): Promise<{ success: boolean; message: string; depositId?: string; }> => {
     if (!PAWAPAY_BASE_URL || !PAWAPAY_API_TOKEN) {
        return { success: false, message: "Payment service is not configured." };
    }

    try {
        const depositId = uuidv4().toUpperCase();
        const formattedAmount = parseFloat(payload.amount).toFixed(2);
        const customerTimestamp = new Date().toISOString();

        const requestBody = {
            depositId,
            amount: formattedAmount,
            currency: payload.currency,
            country: payload.country,
            correspondent: payload.correspondent,
            payer: {
                type: "MSISDN",
                address: {
                    value: payload.customerPhone
                }
            },
            customerTimestamp,
            statementDescription: payload.statementDescription,
            metadata: payload.metadata
        };
        
        const depositApiResponse = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await depositApiResponse.json();
        
        if (!depositApiResponse.ok || responseData.status === 'REJECTED') {
            console.error("pawaPay API Error:", JSON.stringify(responseData, null, 2));
            const errorMessage = responseData.failureReason?.failureMessage || responseData.errorMessage || "Failed to initiate payment.";
            return { success: false, message: errorMessage };
        }
        
        return { success: true, message: "Payment initiated successfully.", depositId };

    } catch (error) {
        console.error("Error during payment process:", error);
        return { success: false, message: "An unexpected server error occurred." };
    }
}

/**
 * Initiates a deposit for a plan upgrade.
 */
export const initiatePlanUpgradeDeposit = async (payload: Omit<PlanDepositPayload, 'metadata'> & {userId: string, planId: string}) => {
    const fullPayload: PlanDepositPayload = {
        ...payload,
        metadata: {
            type: 'plan_upgrade',
            userId: payload.userId,
            planId: payload.planId,
        }
    };
    return createDeposit(fullPayload);
}

/**
 * Initiates a deposit for a ticket purchase.
 */
export const initiateTicketDeposit = async (payload: Omit<TicketDepositPayload, 'metadata'> & {ticketId: string}) => {
    const fullPayload: TicketDepositPayload = {
        ...payload,
        metadata: {
            type: 'ticket_purchase',
            ticketId: payload.ticketId,
        }
    };
    return createDeposit(fullPayload);
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
