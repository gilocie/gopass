
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upgradeUserPlan } from '@/services/userService';
import { createFinalTicket } from '@/services/ticketService';
import type { PlanId } from '@/lib/plans';
import type { OmitIdTicket } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log("Received pawaPay Deposit Callback:", JSON.stringify(callbackData, null, 2));

    if (!callbackData.depositId || !callbackData.status) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }
    
    const { status, metadata } = callbackData;

    if (status === 'COMPLETED' || status === 'SUCCESSFUL') {
      const transactionType = metadata?.type || 'unknown';

      if (transactionType === 'plan_upgrade' && metadata.userId && metadata.planId) {
        console.log(`Upgrading user ${metadata.userId} to plan ${metadata.planId} via callback.`);
        await upgradeUserPlan(metadata.userId, metadata.planId as PlanId);
        console.log(`User ${metadata.userId} successfully upgraded via callback.`);

      } else if (transactionType === 'ticket_purchase' && metadata.ticketId) {
        console.log(`Processing successful payment for ticket ${metadata.ticketId} via callback.`);
        // Note: The ticket creation now happens here, based on the metadata.
        // We're just updating its status and incrementing the event counter.
        const ticketData = metadata as Omit<OmitIdTicket, 'pin'> & {id: string, pin: string};
        
        // This function now handles updating status and incrementing event count
        await createFinalTicket(ticketData.id, ticketData);
        console.log(`Ticket ${metadata.ticketId} payment confirmed and finalized successfully via callback.`);

      } else {
         console.warn("Callback successful but metadata is missing or invalid for processing.", metadata);
      }
    } else {
        console.log(`Deposit ${callbackData.depositId} was not successful. Status: ${status}`);
    }

    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error("Error processing pawaPay callback:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
