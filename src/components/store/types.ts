export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  priceUSD: number;
  priceCLP: number;
  salePriceUSD: number | null;
  salePriceCLP: number | null;
  maxActivations: number;
  versions: { version: string }[];
}

export interface Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export interface ServerStatus {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
  playersOnline?: number;
  playersMax?: number;
  version?: string;
  motd?: string;
}
