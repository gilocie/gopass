
'use client';

import * as React from 'react';
import { XlviLoader } from "react-awesome-loaders";

export function ClientLoader() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; 
  }

  return (
    <XlviLoader
      boxColors={["#EF4444", "#F59E0B", "#6366F1"]}
      desktopSize={"128px"}
      mobileSize={"100px"}
    />
  );
}
