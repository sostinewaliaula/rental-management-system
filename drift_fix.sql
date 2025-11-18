-- DropForeignKey
ALTER TABLE `floor` DROP FOREIGN KEY `Floor_propertyId_fkey`;

-- DropForeignKey
ALTER TABLE `maintenancerequest` DROP FOREIGN KEY `MaintenanceRequest_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_unitId_fkey`;

-- DropForeignKey
ALTER TABLE `unit` DROP FOREIGN KEY `Unit_floorId_fkey`;

-- DropIndex
DROP INDEX `Floor_propertyId_fkey` ON `floor`;

-- DropIndex
DROP INDEX `MaintenanceRequest_unitId_fkey` ON `maintenancerequest`;

-- DropIndex
DROP INDEX `Payment_tenantId_fkey` ON `payment`;

-- DropIndex
DROP INDEX `Payment_unitId_fkey` ON `payment`;

-- DropIndex
DROP INDEX `Unit_floorId_fkey` ON `unit`;

-- AddForeignKey
ALTER TABLE `Floor` ADD CONSTRAINT `Floor_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_floorId_fkey` FOREIGN KEY (`floorId`) REFERENCES `Floor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceRequest` ADD CONSTRAINT `MaintenanceRequest_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

