
export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
