-- Create ExerciseLibrary table
CREATE TABLE `ExerciseLibrary` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('WEIGHTED', 'BODYWEIGHT', 'TIMED') NOT NULL DEFAULT 'WEIGHTED',
    `muscleGroup` VARCHAR(191) NULL,
    `equipment` VARCHAR(191) NULL,
    `difficulty` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExerciseLibrary_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill library from the existing Exercise table (one row per distinct name)
INSERT INTO `ExerciseLibrary` (`id`, `name`, `type`, `videoUrl`, `createdAt`, `updatedAt`)
SELECT
    CONCAT('c', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 24)),
    `name`,
    MIN(`type`),
    MIN(`mediaUrl`),
    NOW(3),
    NOW(3)
FROM `Exercise`
GROUP BY `name`;

-- Rename Exercise -> WorkoutExercise (MySQL rewires ExerciseLog FK automatically)
RENAME TABLE `Exercise` TO `WorkoutExercise`;

-- Drop the old FK so it can be recreated with the expected name
ALTER TABLE `WorkoutExercise` DROP FOREIGN KEY `Exercise_workoutId_fkey`;

-- Add exerciseId column and backfill it from the library by name
ALTER TABLE `WorkoutExercise` ADD COLUMN `exerciseId` VARCHAR(191) NULL;

UPDATE `WorkoutExercise` we
JOIN `ExerciseLibrary` el ON el.`name` = we.`name`
SET we.`exerciseId` = el.`id`;

-- Drop the denormalized columns now owned by the library
ALTER TABLE `WorkoutExercise`
    MODIFY COLUMN `exerciseId` VARCHAR(191) NOT NULL,
    DROP COLUMN `name`,
    DROP COLUMN `type`,
    DROP COLUMN `mediaUrl`;

-- Add indexes + FKs for the new shape
CREATE INDEX `WorkoutExercise_workoutId_idx` ON `WorkoutExercise`(`workoutId`);
CREATE INDEX `WorkoutExercise_exerciseId_idx` ON `WorkoutExercise`(`exerciseId`);

ALTER TABLE `WorkoutExercise`
    ADD CONSTRAINT `WorkoutExercise_workoutId_fkey`
    FOREIGN KEY (`workoutId`) REFERENCES `Workout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `WorkoutExercise_exerciseId_fkey`
    FOREIGN KEY (`exerciseId`) REFERENCES `ExerciseLibrary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
