
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upgradeUserPlan } from '@/services/userService';
import { confirmTicketPayment } from '@/services/ticketService';
import type { PlanId } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log("Received pawaPay Deposit Callback:", JSON.stringify(callbackData, null, 2));

    if (!callbackData.depositId || !callbackData.status) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }
    
    const { status, metadata } = callbackData;

    // We only care about successful payments in the callback
    if (status === 'COMPLETED' || status === 'SUCCESSFUL') { // PawaPay uses both
      const transactionType = metadata?.type || 'unknown';

      if (transactionType === 'plan_upgrade' && metadata.userId && metadata.planId) {
        console.log(`Upgrading user ${metadata.userId} to plan ${metadata.planId} via callback.`);
        await upgradeUserPlan(metadata.userId, metadata.planId as PlanId);
        console.log(`User ${metadata.userId} successfully upgraded via callback.`);

      } else if (transactionType === 'ticket_purchase' && metadata.ticketId) {
        console.log(`Processing successful payment for ticket ${metadata.ticketId} via callback.`);
        await confirmTicketPayment(metadata.ticketId);
        console.log(`Ticket ${metadata.ticketId} payment confirmed successfully via callback.`);

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
