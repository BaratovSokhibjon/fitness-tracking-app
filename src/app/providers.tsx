"use client";

import { IconContext } from "@phosphor-icons/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: "fill", size: 16 }}>{children}</IconContext.Provider>
  );
}
