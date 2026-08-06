-- CreateTable
CREATE TABLE `FoodItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `servingSize` DOUBLE NOT NULL,
    `servingUnit` VARCHAR(191) NOT NULL,
    `caloriesPerServing` INTEGER NOT NULL,
    `proteinPerServing` DOUBLE NOT NULL,
    `carbsPerServing` DOUBLE NOT NULL,
    `fatPerServing` DOUBLE NOT NULL,
    `category` ENUM('PROTEIN', 'CARBS', 'FATS', 'MEAL', 'SNACK', 'DRINK', 'OTHER') NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FoodItem_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodLogEntry` (
    `id` VARCHAR(191) NOT NULL,
    `checkInId` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `calories` INTEGER NOT NULL,
    `protein` DOUBLE NOT NULL,
    `carbs` DOUBLE NOT NULL,
    `fat` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FoodLogEntry` ADD CONSTRAINT `FoodLogEntry_checkInId_fkey` FOREIGN KEY (`checkInId`) REFERENCES `DailyCheckIn`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FoodLogEntry` ADD CONSTRAINT `FoodLogEntry_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
