import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Targets, baselines, and program settings.</p>
      </div>
      <ProfileForm
        profile={
          profile
            ? {
                age: profile.age,
                height: profile.height,
                programStartDate: profile.programStartDate?.toISOString() ?? null,
                dailyCaloriesTarget: profile.dailyCaloriesTarget,
                dailyProteinTarget: profile.dailyProteinTarget,
                dailyCarbsTarget: profile.dailyCarbsTarget,
                dailyFatTarget: profile.dailyFatTarget,
                dailyWaterTarget: profile.dailyWaterTarget,
                dailyStepsTarget: profile.dailyStepsTarget,
                sleepTarget: profile.sleepTarget,
              }
            : null
        }
      />
    </div>
  );
}
