/*
  Warnings:

  - Made the column `minReps` on table `WorkoutExercise` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxReps` on table `WorkoutExercise` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `WorkoutExercise` MODIFY `minReps` INTEGER NOT NULL,
    MODIFY `maxReps` INTEGER NOT NULL;
