import { logger } from "../../logger";
import { httpsClient } from "../https";
import { TailscaleDevice, TailscaleListDevicesResponse } from "./tailscale.types";

const {
  TAILSCALE_OAUTH_CLIENT_ID = "",
  TAILSCALE_OAUTH_CLIENT_SECRET = "",
  TAILSCALE_TAILNET = "",
} = process.env;
const hostname = "api.tailscale.com";
const basePath = `/api/v2/tailnet/${TAILSCALE_TAILNET}`;

let tokenRefreshedAt = 0;
let tailscaleToken: TailscaleToken;

type TailscaleToken = {
  access_token: string;
  token_type: "Bearer";
  expires_in: 3600;
  scope: string;
};

export const getOAuth2Token = async () => {
  const body = new URLSearchParams();
  body.append("client_id", TAILSCALE_OAUTH_CLIENT_ID);
  body.append("client_secret", TAILSCALE_OAUTH_CLIENT_SECRET);

  if (Date.now() - tokenRefreshedAt < 3559) {
    logger.debug("Using existing token");
    return tailscaleToken.access_token;
  }

  const token = await httpsClient<TailscaleToken>({
    hostname: "api.tailscale.com",
    path: "/api/v2/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": body.toString().length,
    },
    body,
  });

  tailscaleToken = token;
  tokenRefreshedAt = Date.now();
  logger.log("tokenRefreshedAt", tokenRefreshedAt);

  return token.access_token;
};

let listDevicesCache: TailscaleListDevicesResponse["devices"] = [];
let listDevicesCacheRefreshedAt = Date.now();
const fiveMinutesInMillis = 60 * 1000 * 5;

export const listDevices = async ({
  fields,
  useCache = true,
}: {
  fields: string;
  useCache?: boolean;
}): Promise<TailscaleDevice[]> => {
  if (
    useCache &&
    Array.isArray(listDevicesCache) &&
    listDevicesCache.length &&
    Date.now() - listDevicesCacheRefreshedAt < fiveMinutesInMillis
  ) {
    return listDevicesCache;
  }

  const response = await httpsClient<TailscaleListDevicesResponse>({
    hostname,
    path: `${basePath}/devices${fields ? `?fields=${fields}` : ""}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getOAuth2Token()}`,
    },
  });

  listDevicesCache = response.devices;
  listDevicesCacheRefreshedAt = Date.now();
  console.log(
    "Refreshed Tailscale devices cache at",
    new Date(listDevicesCacheRefreshedAt).toISOString(),
  );

  return response.devices;
};

export const getCurrentProfileByIp = async (ip: string) => {
  const devices = await listDevices({ fields: "" });
  const usersByAddress = devices.reduce(
    (acc, { user, addresses }) => {
      const addr = addresses
        .map((a) => ({ [a]: user }))
        .reduce((acc, value) => {
          return {
            ...acc,
            ...value,
          };
        }, {});

      return {
        ...acc,
        ...addr,
      };
    },
    {} as Record<string, string>,
  );
  const userEmail = usersByAddress[ip];

  return userEmail || "";
};
