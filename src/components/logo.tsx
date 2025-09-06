
      import { Ticket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    siteName?: string | null;
    logoUrl?: string | null;
}

export default function Logo({ className, siteName, logoUrl }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
        {logoUrl ? (
            <div className="relative h-8 w-24">
                <Image src={logoUrl} alt={siteName || 'GoPass'} fill style={{objectFit: 'contain'}} />
            </div>
        ) : (
            <>
                <Ticket className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold tracking-tight text-primary-dark font-headline">
                    {siteName || 'GoPass'}
                </span>
            </>
        )}
    </Link>
  );
}

    