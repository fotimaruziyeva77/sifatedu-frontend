"use client";

import { createContext, type ReactNode, useContext } from "react";

export type Brand = {
  name: string;
  logo: string;
  logoDark: string;
  /** Birinchi markaz: «SIFAT» vektor logosi va hozirgi landing. */
  flagship: boolean;
  /** Yozilgan huquqiy sahifalar: `offer`, `privacy`, `refund-policy`. */
  legal: readonly string[];
};

const BrandContext = createContext<Brand>({
  name: "",
  logo: "",
  logoDark: "",
  flagship: false,
  legal: [],
});

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext value={brand}>{children}</BrandContext>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}
