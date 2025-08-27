
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    console.log("Received pawaPay Refund Callback:", JSON.stringify(callbackData, null, 2));
    
    // TODO: Add logic to handle refund status updates
    
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error("Error processing pawaPay refund callback:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
