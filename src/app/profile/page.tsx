import { getProfile } from "@/actions/profile";
import { getCreatineConfig } from "@/actions/creatine";
import { ProfileForm } from "@/components/profile/profile-form";
import { CreatineForm } from "@/components/profile/creatine-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, creatineConfig] = await Promise.all([getProfile(), getCreatineConfig()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-ink">Profile</h1>
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
                dailyCaffeineTarget: profile.dailyCaffeineTarget,
                sleepTarget: profile.sleepTarget,
              }
            : null
        }
      />

      <CreatineForm
        config={
          creatineConfig
            ? {
                enabled: creatineConfig.enabled,
                protocol: creatineConfig.protocol,
                startDate: creatineConfig.startDate?.toISOString() ?? null,
                loadingDays: creatineConfig.loadingDays,
                loadingDose: creatineConfig.loadingDose,
                maintenanceDose: creatineConfig.maintenanceDose,
              }
            : null
        }
      />
    </div>
  );
}
