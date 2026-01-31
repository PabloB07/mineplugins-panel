-- AlterTable
ALTER TABLE "LicenseActivation" ADD COLUMN     "serverName" TEXT,
ADD COLUMN     "serverPort" INTEGER,
ADD COLUMN     "motd" TEXT,
ADD COLUMN     "onlineMode" BOOLEAN,
ADD COLUMN     "maxPlayers" INTEGER,
ADD COLUMN     "onlinePlayers" INTEGER,
ADD COLUMN     "plugins" TEXT;