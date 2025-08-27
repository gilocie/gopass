
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    console.log("Received pawaPay Payout Callback:", JSON.stringify(callbackData, null, 2));

    // TODO: Add logic to handle payout status updates (e.g., for refunds)
    
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error("Error processing pawaPay payout callback:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
