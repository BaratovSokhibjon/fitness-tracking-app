import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function OnboardingCard({
  step,
  totalSteps,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="border-hairline">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border border-ink font-mono text-sm font-medium text-ink">
            {step}
          </span>
          <div>
            <p className="text-sm font-medium text-ink">{title}</p>
            <div className="mt-0.5 flex gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < step ? "h-1 w-4 bg-ink" : "h-1 w-4 bg-hairline"
                  }
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm leading-6 text-mute">{description}</p>
        <Button asChild>
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
