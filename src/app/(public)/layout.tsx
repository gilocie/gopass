import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LandingHeader } from "@/components/landing-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <LandingHeader />
        <main className="flex-grow">{children}</main>
        <footer className="py-8 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-foreground/60">
            <p>&copy; {new Date().getFullYear()} GoPass. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </CurrencyProvider>
  );
}
