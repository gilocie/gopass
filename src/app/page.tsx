
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, QrCode, Users, BarChart2 } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />

      <main className="flex-grow">
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-primary-dark font-headline">
              Seamless Events, Secure Access.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg lg:text-xl text-foreground/80">
              GoPass is the all-in-one platform for modern event organizers. Create, manage, and verify tickets with unparalleled ease and security.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                {user ? (
                   <Link href="/dashboard">Go to Dashboard</Link>
                ) : (
                  <Link href="/register">Get Started Free</Link>
                )}
              </Button>
              <Button size="lg" variant="outline" asChild>
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

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-foreground/60">
          <p>&copy; {new Date().getFullYear()} GoPass. All rights reserved.</p>
        </div>
      </footer>
    </div>
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
