-- AlterTable
ALTER TABLE `ExerciseLibrary` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `WorkoutExercise` MODIFY `minReps` INTEGER NULL,
    MODIFY `maxReps` INTEGER NULL;
