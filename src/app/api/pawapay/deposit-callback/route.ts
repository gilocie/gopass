
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upgradeUserPlan } from '@/services/userService';
import { addTicket } from '@/services/ticketService';
import type { PlanId } from '@/lib/plans';
import type { OmitIdTicket } from '@/lib/types';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log("Received pawaPay Deposit Callback:", JSON.stringify(callbackData, null, 2));

    if (!callbackData.depositId || !callbackData.status) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }
    
    const { status, metadata } = callbackData;

    if (status === 'SUCCESSFUL') {
      const transactionType = metadata?.type || 'unknown';

      if (transactionType === 'plan_upgrade' && metadata.userId && metadata.planId) {
        console.log(`Upgrading user ${metadata.userId} to plan ${metadata.planId}`);
        await upgradeUserPlan(metadata.userId, metadata.planId as PlanId);
        console.log(`User ${metadata.userId} successfully upgraded.`);

      } else if (transactionType === 'ticket_purchase' && metadata.eventId && metadata.ticketId) {
        console.log(`Processing successful ticket purchase for event ${metadata.eventId}`);
        
        const newTicket: OmitIdTicket & {id: string} = {
            id: metadata.ticketId,
            eventId: metadata.eventId,
            holderName: metadata.holderName,
            holderEmail: metadata.holderEmail,
            holderPhone: metadata.holderPhone,
            holderPhotoUrl: metadata.holderPhotoUrl,
            pin: metadata.pin,
            ticketType: metadata.ticketType,
            benefits: metadata.benefits,
            status: 'active',
            holderTitle: '',
            backgroundImageUrl: metadata.backgroundImageUrl,
            backgroundImageOpacity: metadata.backgroundImageOpacity,
            totalPaid: metadata.totalPaid,
            paymentMethod: 'online',
            paymentStatus: 'completed',
        };

        // Create the ticket and increment the event count
        await addTicket(newTicket);
        
        console.log(`Ticket ${metadata.ticketId} created successfully.`);

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
