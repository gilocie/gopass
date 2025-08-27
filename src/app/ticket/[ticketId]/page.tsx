
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Ticket } from '@/lib/types'; // Using a proper type for better safety

export default function ViewTicketPage() {
  const params = useParams();
  const id = params.ticketId as string; // Correctly get ticketId from params
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;

      try {
        // ✅ Correct path: /tickets/{id}
        const docRef = doc(db, "tickets", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() } as Ticket);
        } else {
          setTicket(null);
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setTicket(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) return <p>Loading ticket...</p>;
  if (!ticket) return <p>❌ Ticket Not Found</p>;

  return (
    <div className="p-6 max-w-lg mx-auto border rounded-lg shadow-md m-4 bg-card text-card-foreground">
      <h1 className="text-xl font-bold mb-4">🎟 Ticket Details</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {ticket.id}</p>
        <p><strong>Name:</strong> {ticket.holderName}</p>
        <p><strong>Email:</strong> {ticket.holderEmail}</p>
        <p><strong>Event ID:</strong> {ticket.eventId}</p>
        <p><strong>Status:</strong> <span className="capitalize">{ticket.status}</span></p>

        <h2 className="mt-4 pt-4 border-t font-semibold">Benefits</h2>
        {ticket.benefits && ticket.benefits.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {ticket.benefits.map((b: any) => (
              <li key={b.id}>
                {b.name} – {b.used ? "✅ Used" : "❌ Not Used"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No benefits assigned.</p>
        )}
      </div>
    </div>
  );
}
