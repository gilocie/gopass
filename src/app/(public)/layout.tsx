
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <LandingHeader />
        <main className="flex-grow">{children}</main>
        <LandingFooter />
      </div>
    </CurrencyProvider>
  );
}
