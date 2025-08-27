import { Ticket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Ticket className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold tracking-tight text-primary-dark font-headline">
        GoPass
      </span>
    </Link>
  );
}
