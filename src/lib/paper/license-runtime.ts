import { prisma } from "@/lib/prisma";
import { verifyPaperLicenseKey, hashForPrivacy } from "@/lib/license";
import { normalizePluginId } from "@/lib/license-utils";

interface RuntimeLicense {
  ok: true;
  data: {
    license: {
      id: string;
      licenseKey: string;
      productId: string;
      product: { name: string; slug: string };
      userId: string;
      status: string;
      expiresAt: Date;
      maxActivations: number;
    };
    pluginId: string;
  };
}

interface RuntimeError {
  ok: false;
  error: {
    result: string;
    message: string;
    status: number;
  };
}

export async function loadRuntimeLicense(
  licenseKey: string,
  pluginId?: string | null
): Promise<RuntimeLicense | RuntimeError> {
  try {
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        product: {
          select: { name: true, slug: true },
        },
        _count: {
          select: { activations: true },
        },
      },
    });

    if (!license) {
      return {
        ok: false,
        error: {
          result: "NOT_FOUND",
          message: "License not found",
          status: 404,
        },
      };
    }

    const normalizedPluginId = normalizePluginId(license.product.slug);
    const inputPluginId = normalizePluginId(pluginId || "");

    if (inputPluginId && normalizedPluginId !== inputPluginId) {
      return {
        ok: false,
        error: {
          result: "WRONG_PLUGIN",
          message: "License is for a different plugin",
          status: 403,
        },
      };
    }

    if (!verifyPaperLicenseKey(license.product.slug, licenseKey)) {
      return {
        ok: false,
        error: {
          result: "SIGNATURE_INVALID",
          message: "License key signature verification failed",
          status: 401,
        },
      };
    }

    if (license.status === "REVOKED") {
      return {
        ok: false,
        error: {
          result: "REVOKED",
          message: "This license has been revoked",
          status: 403,
        },
      };
    }

    if (license.expiresAt < new Date()) {
      if (license.status === "ACTIVE") {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: "EXPIRED" },
        });
      }
      return {
        ok: false,
        error: {
          result: "EXPIRED",
          message: "This license has expired",
          status: 410,
        },
      };
    }

    if (license.status !== "ACTIVE") {
      return {
        ok: false,
        error: {
          result: license.status,
          message: `License status is ${license.status}`,
          status: 403,
        },
      };
    }

    return {
      ok: true,
      data: {
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          productId: license.productId,
          product: license.product,
          userId: license.userId,
          status: license.status,
          expiresAt: license.expiresAt,
          maxActivations: license.maxActivations,
        },
        pluginId: normalizedPluginId,
      },
    };
  } catch (error) {
    console.error("Load runtime license error:", error);
    return {
      ok: false,
      error: {
        result: "REMOTE_ERROR",
        message: "Failed to load license data",
        status: 500,
      },
    };
  }
}

interface TouchActivationResult {
  ok: true;
  activation: {
    id: string;
    isActive: boolean;
  };
  currentActivations: number;
}

interface TouchActivationError {
  ok: false;
  error: string;
  message: string;
  status: number;
}

interface ActivationData {
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

export async function touchLicenseActivation(
  license: { id: string; maxActivations: number },
  serverId: string,
  data: ActivationData
): Promise<TouchActivationResult | TouchActivationError> {
  try {
    const activations = await prisma.licenseActivation.findMany({
      where: { licenseId: license.id, isActive: true },
    });

    const currentCount = activations.length;

    if (currentCount >= license.maxActivations) {
      const existing = activations.find((a) => a.serverId === serverId);
      if (!existing) {
        return {
          ok: false,
          error: "MAX_ACTIVATIONS",
          message: `Maximum activations (${license.maxActivations}) reached`,
          status: 403,
        };
      }
    }

    const existingActivation = activations.find((a) => a.serverId === serverId);

    if (existingActivation) {
      const updated = await prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: {
          isActive: true,
          serverIp: data.serverIp,
          serverVersion: data.serverVersion,
          minecraftVersion: data.minecraftVersion,
          serverName: data.serverName,
          serverPort: data.serverPort,
          motd: data.motd,
          onlineMode: data.onlineMode,
          maxPlayers: data.maxPlayers,
          onlinePlayers: data.onlinePlayers,
          plugins: data.plugins ? JSON.stringify(data.plugins) : null,
          macAddress: data.macAddress,
          hardwareHash: data.hardwareHash,
          networkSignature: data.networkSignature,
          lastSeenAt: new Date(),
          validationCount: existingActivation.validationCount + 1,
        },
      });

      return {
        ok: true,
        activation: { id: updated.id, isActive: updated.isActive },
        currentActivations: currentCount,
      };
    }

    const newActivation = await prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        serverId,
        serverIp: data.serverIp,
        serverVersion: data.serverVersion,
        minecraftVersion: data.minecraftVersion,
        serverName: data.serverName,
        serverPort: data.serverPort,
        motd: data.motd,
        onlineMode: data.onlineMode,
        maxPlayers: data.maxPlayers,
        onlinePlayers: data.onlinePlayers,
        plugins: data.plugins ? JSON.stringify(data.plugins) : null,
        macAddress: data.macAddress,
        hardwareHash: data.hardwareHash,
        networkSignature: data.networkSignature,
        isActive: true,
        lastSeenAt: new Date(),
        validationCount: 1,
      },
    });

    return {
      ok: true,
      activation: { id: newActivation.id, isActive: newActivation.isActive },
      currentActivations: currentCount + 1,
    };
  } catch (error) {
    console.error("Touch activation error:", error);
    return {
      ok: false,
      error: "INTERNAL_ERROR",
      message: "Failed to update activation",
      status: 500,
    };
  }
}
