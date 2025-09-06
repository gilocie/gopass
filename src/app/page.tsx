
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, QrCode, Users, BarChart2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { BrandingSettings } from '@/lib/types';
import { getBrandingSettings } from '@/services/settingsService';
import Image from 'next/image';

export default function Home() {
  const { user } = useAuth();
  const [settings, setSettings] = React.useState<BrandingSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
        try {
            const fetchedSettings = await getBrandingSettings();
            setSettings(fetchedSettings);
        } catch (error) {
            console.error("Failed to load branding settings", error);
        } finally {
            setLoading(false);
        }
    }
    fetchSettings();
  }, []);

  const heroTitle = settings?.hero?.title || "Seamless Events, Secure Access.";
  const heroSubtitle = settings?.hero?.subtitle || "GoPass is the all-in-one platform for modern event organizers. Create, manage, and verify tickets with unparalleled ease and security.";
  const heroImageUrl = settings?.hero?.backgroundImageUrl;

  return (
    <main className="flex-grow">
      <section className="relative text-center py-20 lg:py-32 flex items-center justify-center">
          {heroImageUrl && (
              <Image src={heroImageUrl} alt="Hero background" layout="fill" objectFit="cover" className="z-0" data-ai-hint="event crowd" />
          )}
           <div className="absolute inset-0 bg-black/60 z-10" />
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-20 text-white">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight font-headline">
                  {heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg lg:text-xl text-white/90">
                  {heroSubtitle}
              </p>
              <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {user ? (
                  <Link href="/dashboard">Go to Dashboard</Link>
                  ) : (
                  <Link href="/register">Get Started Free</Link>
                  )}
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                  <Link href="/select-event-for-scan">Scan Ticket</Link>
              </Button>
              </div>
          </div>
      </section>

      <section id="features" className="py-20 lg:py-24 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-headline">Why Choose GoPass?</h2>
            <p className="mt-2 text-lg text-foreground/70">
              Everything you need to run a successful event.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Ticket className="w-8 h-8 text-primary" />}
              title="Advanced Ticket Designer"
              description="Create beautiful, custom tickets with dynamic data and branding."
            />
            <FeatureCard
              icon={<QrCode className="w-8 h-8 text-primary" />}
              title="Secure QR Verification"
              description="Scan and verify tickets instantly. Track benefits and attendance with ease."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-primary" />}
              title="Attendee Management"
              description="Easily upload and manage attendees via CSV or manual entry."
            />
            <FeatureCard
              icon={<BarChart2 className="w-8 h-8 text-primary" />}
              title="Insightful Reporting"
              description="Download detailed reports on attendance and benefit usage."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="text-center bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
          {icon}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
