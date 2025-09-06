
      import { LandingHeader } from "@/components/landing-header";
import { getBrandingSettings } from "@/services/settingsService";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getBrandingSettings();
  const copyrightText = settings?.footer?.copyrightText || `© ${new Date().getFullYear()} GoPass. All rights reserved.`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader settings={settings} />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {children}
      </main>
       <footer className="py-8 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-foreground/60">
            <p>{copyrightText}</p>
          </div>
        </footer>
    </div>
  );
}

    