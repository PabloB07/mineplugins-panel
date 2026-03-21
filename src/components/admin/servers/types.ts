export interface ServerStatus {
  id: string;
  name: string;
  ip: string;
  port: number;
  isOnline: boolean;
  lastChecked: string | null;
  status: string;
  isPublic: boolean;
  playersOnline?: number;
  playersMax?: number;
  version?: string;
  motd?: string;
}

export interface ServerFormData {
  name: string;
  ip: string;
  port: string;
  isPublic: boolean;
}
