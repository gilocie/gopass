
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { upgradeUserPlan } from '@/services/userService';
import type { PlanId } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();

    console.log("Received pawaPay Deposit Callback:", JSON.stringify(callbackData, null, 2));

    // Basic validation
    if (!callbackData.depositId || !callbackData.status || !callbackData.metadata) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }
    
    const { status, metadata } = callbackData;
    const { userId, planId } = metadata;

    if (status === 'SUCCESSFUL') {
      if (userId && planId) {
        console.log(`Upgrading user ${userId} to plan ${planId}`);
        await upgradeUserPlan(userId, planId as PlanId);
        console.log(`User ${userId} successfully upgraded.`);
      } else {
         console.warn("Callback successful but missing userId or planId in metadata");
      }
    } else {
        console.log(`Deposit ${callbackData.depositId} was not successful. Status: ${status}`);
        // Here you might want to log the failure in your database for the user.
    }

    // Acknowledge receipt to pawaPay
    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error) {
    console.error("Error processing pawaPay callback:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
