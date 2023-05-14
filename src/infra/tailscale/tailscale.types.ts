export type TailscaleDevice = {
  addresses: string[];
  id: string;
  nodeId: string;
  user: string;
  name: string;
  hostname: string;
  clientVersion: string;
  updateAvailable: boolean;
  os: string;
  created: string;
  lastSeen: string;
  keyExpiryDisabled: boolean;
  expires: string;
  authorized: boolean;
  isExternal: boolean;
  machineKey: string;
  nodeKey: string;
  tailnetLockKey: string;
  blocksIncomingConnections: boolean;
  enabledRoutes: unknown[]; // TODO: Figure out enabledRoutes
  advertisedRoutes: unknown[]; // TODO: Figure out advertisedRoutes
  clientConnectivity: {
    endpoints: string[];
    derp: string;
    mappingVariesByDestIP: boolean | null;
    latency: Record<
      string,
      {
        preferred?: boolean;
        latencyMs: number;
      }
    >;
    clientSupports: {
      hairPinning: boolean;
      ipv6: boolean;
      pcp: boolean;
      pmp: boolean;
      udp: boolean;
      upnp: boolean;
    };
  };
};

export type TailscaleListDevicesResponse = {
  devices: TailscaleDevice[];
};
