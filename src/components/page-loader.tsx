
'use client';

import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full absolute inset-0">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
