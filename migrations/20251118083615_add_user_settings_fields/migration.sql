-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `notificationPreferences` JSON NULL,
    ADD COLUMN `organizationAddress` VARCHAR(191) NULL,
    ADD COLUMN `organizationLogo` VARCHAR(191) NULL,
    ADD COLUMN `organizationName` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false;
