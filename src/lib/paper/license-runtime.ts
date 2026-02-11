import { License, LicenseStatus, Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyPaperLicenseKey } from "@/lib/license";
import { markExpiredIfNeeded, normalizePluginId } from "@/lib/paper/license-endpoint";

export type RuntimeLicense = License & {
  product: Product;
  activations: {
    id: string;
    serverId: string;
    isActive: boolean;
    validationCount: number;
    macAddress: string | null;
    hardwareHash: string | null;
    networkSignature: string | null;
    serverVersion: string | null;
    minecraftVersion: string | null;
    serverName: string | null;
    serverPort: number | null;
    motd: string | null;
    onlineMode: boolean | null;
    maxPlayers: number | null;
    onlinePlayers: number | null;
    plugins: string | null;
  }[];
};

export interface LicenseRuntimeFailure {
  result:
    | "NOT_FOUND"
    | "WRONG_PLUGIN"
    | "EXPIRED"
    | "REVOKED"
    | "SIGNATURE_INVALID"
    | "REMOTE_ERROR";
  status: number;
  message: string;
}

export interface LicenseRuntimeSuccess {
  license: RuntimeLicense;
  pluginId: string;
}

export async function loadRuntimeLicense(
  key: string,
  pluginId?: string
): Promise<{ ok: true; data: LicenseRuntimeSuccess } | { ok: false; error: LicenseRuntimeFailure }> {
  const license = await prisma.license.findUnique({
    where: { licenseKey: key },
    include: {
      product: true,
      activations: true,
    },
  });

  if (!license) {
    return {
      ok: false,
      error: {
        result: "NOT_FOUND",
        status: 404,
        message: "License not found",
      },
    };
  }

  const dbPluginId = normalizePluginId(license.product.slug);
  const requestedPluginId = normalizePluginId(pluginId || dbPluginId);

  if (requestedPluginId !== dbPluginId) {
    return {
      ok: false,
      error: {
        result: "WRONG_PLUGIN",
        status: 403,
        message: "License does not belong to this plugin",
      },
    };
  }

  if (!verifyPaperLicenseKey(dbPluginId, key)) {
    return {
      ok: false,
      error: {
        result: "SIGNATURE_INVALID",
        status: 403,
        message: "Invalid license signature",
      },
    };
  }

  const expiredNow = await markExpiredIfNeeded(license);
  if (expiredNow || license.status === LicenseStatus.EXPIRED) {
    return {
      ok: false,
      error: {
        result: "EXPIRED",
        status: 403,
        message: "License has expired",
      },
    };
  }

  if (license.status === LicenseStatus.REVOKED || license.status === LicenseStatus.SUSPENDED) {
    return {
      ok: false,
      error: {
        result: "REVOKED",
        status: 403,
        message: `License is ${license.status.toLowerCase()}`,
      },
    };
  }

  if (license.status !== LicenseStatus.ACTIVE) {
    return {
      ok: false,
      error: {
        result: "REMOTE_ERROR",
        status: 500,
        message: "Unexpected license status",
      },
    };
  }

  return {
    ok: true,
    data: {
      license,
      pluginId: dbPluginId,
    },
  };
}

export async function touchLicenseActivation(
  license: RuntimeLicense,
  serverId: string,
  fields: {
    serverIp?: string;
    serverVersion?: string;
    minecraftVersion?: string;
    serverName?: string;
    serverPort?: number;
    motd?: string;
    onlineMode?: boolean;
    maxPlayers?: number;
    onlinePlayers?: number;
    plugins?: string[];
    macAddress?: string;
    hardwareHash?: string;
    networkSignature?: string;
  }
): Promise<{ ok: true; currentActivations: number } | { ok: false; status: number; error: string; message: string }> {
  const existingActivation = license.activations.find((a) => a.serverId === serverId);
  const activeActivations = license.activations.filter((a) => a.isActive).length;

  if (!existingActivation && activeActivations >= license.maxActivations) {
    return {
      ok: false,
      status: 403,
      error: "MAX_ACTIVATIONS",
      message: `Maximum activations reached (${license.maxActivations})`,
    };
  }

  const now = new Date();
  const encodedPlugins = fields.plugins ? JSON.stringify(fields.plugins) : null;

  if (!existingActivation) {
    await prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        serverId,
        serverIp: fields.serverIp,
        serverVersion: fields.serverVersion,
        minecraftVersion: fields.minecraftVersion,
        serverName: fields.serverName,
        serverPort: fields.serverPort,
        motd: fields.motd,
        onlineMode: fields.onlineMode,
        maxPlayers: fields.maxPlayers,
        onlinePlayers: fields.onlinePlayers,
        plugins: encodedPlugins,
        macAddress: fields.macAddress,
        hardwareHash: fields.hardwareHash,
        networkSignature: fields.networkSignature,
        isActive: true,
        validationCount: 1,
        lastSeenAt: now,
      },
    });

    return { ok: true, currentActivations: activeActivations + 1 };
  }

  const data: Prisma.LicenseActivationUpdateInput = {
    lastSeenAt: now,
    validationCount: { increment: 1 },
  };

  if (fields.serverIp !== undefined) data.serverIp = fields.serverIp;
  if (fields.serverVersion !== undefined) data.serverVersion = fields.serverVersion;
  if (fields.minecraftVersion !== undefined) data.minecraftVersion = fields.minecraftVersion;
  if (fields.serverName !== undefined) data.serverName = fields.serverName;
  if (fields.serverPort !== undefined) data.serverPort = fields.serverPort;
  if (fields.motd !== undefined) data.motd = fields.motd;
  if (fields.onlineMode !== undefined) data.onlineMode = fields.onlineMode;
  if (fields.maxPlayers !== undefined) data.maxPlayers = fields.maxPlayers;
  if (fields.onlinePlayers !== undefined) data.onlinePlayers = fields.onlinePlayers;
  if (fields.plugins !== undefined) data.plugins = encodedPlugins;
  if (fields.macAddress !== undefined) data.macAddress = fields.macAddress;
  if (fields.hardwareHash !== undefined) data.hardwareHash = fields.hardwareHash;
  if (fields.networkSignature !== undefined) data.networkSignature = fields.networkSignature;

  await prisma.licenseActivation.update({
    where: { id: existingActivation.id },
    data,
  });

  return { ok: true, currentActivations: activeActivations };
}
