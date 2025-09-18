-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               12.0.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table rental_mgmt.floor
CREATE TABLE IF NOT EXISTS `floor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `propertyId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Floor_propertyId_fkey` (`propertyId`),
  CONSTRAINT `Floor_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `property` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.floor: ~5 rows (approximately)
INSERT INTO `floor` (`id`, `name`, `propertyId`) VALUES
	(1, 'Ground Floor', 1),
	(2, 'First Floor', 1),
	(3, 'Ground Floor', 2),
	(8, 'Second Floor', 4),
	(9, 'third floor', 4);

-- Dumping structure for table rental_mgmt.maintenancerequest
CREATE TABLE IF NOT EXISTS `maintenancerequest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `priority` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL,
  `dateReported` datetime(3) NOT NULL,
  `unitId` int(11) NOT NULL,
  `tenantId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MaintenanceRequest_unitId_fkey` (`unitId`),
  KEY `MaintenanceRequest_tenantId_fkey` (`tenantId`),
  CONSTRAINT `MaintenanceRequest_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `MaintenanceRequest_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.maintenancerequest: ~0 rows (approximately)
INSERT INTO `maintenancerequest` (`id`, `title`, `description`, `priority`, `status`, `dateReported`, `unitId`, `tenantId`) VALUES
	(1, 'test', 'test mantainace 2', 'medium', 'in_progress', '2025-09-18 10:35:38.360', 9, 2),
	(2, 'lanlord', 'ffnfd', 'medium', 'pending', '2025-09-18 11:04:07.825', 8, NULL);

-- Dumping structure for table rental_mgmt.notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` varchar(191) NOT NULL,
  `time` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Notification_userId_fkey` (`userId`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.notification: ~0 rows (approximately)

-- Dumping structure for table rental_mgmt.payment
CREATE TABLE IF NOT EXISTS `payment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `amount` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `status` varchar(191) NOT NULL,
  `date` datetime(3) DEFAULT NULL,
  `dueDate` datetime(3) NOT NULL,
  `method` varchar(191) DEFAULT NULL,
  `reference` varchar(191) DEFAULT NULL,
  `tenantId` int(11) NOT NULL,
  `unitId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Payment_tenantId_fkey` (`tenantId`),
  KEY `Payment_unitId_fkey` (`unitId`),
  CONSTRAINT `Payment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenant` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Payment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.payment: ~0 rows (approximately)
INSERT INTO `payment` (`id`, `amount`, `month`, `year`, `status`, `date`, `dueDate`, `method`, `reference`, `tenantId`, `unitId`) VALUES
	(1, 788665, 9, 2025, 'completed', '2025-09-18 14:27:41.311', '2025-09-05 07:00:00.000', 'M-Pesa', 'MPE331067025', 2, 9);

-- Dumping structure for table rental_mgmt.property
CREATE TABLE IF NOT EXISTS `property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `location` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `image` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.property: ~4 rows (approximately)
INSERT INTO `property` (`id`, `name`, `location`, `type`, `image`, `createdAt`, `updatedAt`) VALUES
	(1, 'Westlands Apartment', 'Westlands, Nairobi', 'Apartment', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=60', '2025-09-17 14:49:59.471', '2025-09-17 14:49:59.471'),
	(2, 'Kilimani Townhouse', 'Kilimani, Nairobi', 'Townhouse', 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=60', '2025-09-17 14:49:59.483', '2025-09-17 14:49:59.483'),
	(4, 'Test 2', 'Nairobi', 'Apartment', '', '2025-09-17 16:48:43.181', '2025-09-17 18:06:03.468');

-- Dumping structure for table rental_mgmt.tenant
CREATE TABLE IF NOT EXISTS `tenant` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `moveInDate` datetime(3) NOT NULL,
  `leaseEnd` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL,
  `unitId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Tenant_unitId_fkey` (`unitId`),
  KEY `Tenant_userId_fkey` (`userId`),
  CONSTRAINT `Tenant_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Tenant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.tenant: ~2 rows (approximately)
INSERT INTO `tenant` (`id`, `name`, `email`, `phone`, `moveInDate`, `leaseEnd`, `status`, `unitId`, `userId`) VALUES
	(1, 'Sostine Manyasi Waliaula', 'sostinewaliaula@gmail.com', '0712061517', '2025-09-18 00:00:00.000', '2025-09-25 00:00:00.000', 'active', 8, 4),
	(2, 'Manyasiw', 'sostinewaliaulay@gmail.com', '0712061517', '2025-09-18 00:00:00.000', '2025-09-19 00:00:00.000', 'active', 9, 5);

-- Dumping structure for table rental_mgmt.unit
CREATE TABLE IF NOT EXISTS `unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `rent` int(11) NOT NULL,
  `status` varchar(191) NOT NULL,
  `floorId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Unit_floorId_fkey` (`floorId`),
  CONSTRAINT `Unit_floorId_fkey` FOREIGN KEY (`floorId`) REFERENCES `floor` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.unit: ~7 rows (approximately)
INSERT INTO `unit` (`id`, `number`, `type`, `rent`, `status`, `floorId`) VALUES
	(1, 'G1', 'one bedroom', 45000, 'occupied', 1),
	(2, 'G2', 'studio', 25000, 'vacant', 1),
	(3, '1A', 'two bedroom', 60000, 'maintenance', 2),
	(4, '1B', 'bedsitter', 18000, 'vacant', 2),
	(5, 'G1', 'three bedroom', 95000, 'vacant', 3),
	(8, 'G1', 'one bedroom', 767899, 'occupied', 8),
	(9, 'gh', 'studio', 788665, 'occupied', 9);

-- Dumping structure for table rental_mgmt.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt.user: ~4 rows (approximately)
INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
	(1, 'Admin', 'admin@example.com', '$2a$10$5p0FwxnzrJmw6JHuvqpcuuY/QnbYbHFwNKFLjFgRy.6J85J48kA/e', 'admin', '2025-09-17 11:45:58.388', '2025-09-17 14:49:57.437'),
	(2, 'John Landlord', 'landlord@example.com', '$2a$10$nDrh/INJ7vtAX8rK1Gd9tev.jncSH6G6rGUt8Pw7hFrK211E5amrG', 'landlord', '2025-09-17 11:45:58.862', '2025-09-17 14:49:58.310'),
	(3, 'Tina Tenant', 'tenant@example.com', '$2a$10$mBL2m8kWbbWA1NSXYeW6J.sqOvsHBpxKuFoT8pnX5LoV3Nu.kdg6.', 'tenant', '2025-09-17 11:45:59.285', '2025-09-17 14:49:59.454'),
	(4, 'Sostine Manyasi Waliaula', 'sostinewaliaula@gmail.com', '$2a$10$ccciIx7PnFwH1HJquqiP6OHeNHYXS3.9sGLBoi8jX8GJOnL.OCxBy', 'tenant', '2025-09-17 18:26:56.115', '2025-09-17 18:26:56.115'),
	(5, 'Manyasi', 'sostinewaliaulay@gmail.com', '$2a$10$2.LD3VhPW4t.e1V6PFPdG.w2EiqzfdQnvl529Uuj2AtnkcZfOsczi', 'tenant', '2025-09-17 18:33:17.119', '2025-09-17 18:33:17.119');

-- Dumping structure for table rental_mgmt._prisma_migrations
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table rental_mgmt._prisma_migrations: ~0 rows (approximately)
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('fb1a40d9-2e4e-4c50-8497-67967acac68e', '58feebe2babbc7672e11bc8c25181fc8e39dfbd4243b41c63812aa651c2196c6', '2025-09-17 11:45:30.077', '20250917114446_init', NULL, NULL, '2025-09-17 11:45:25.254', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
