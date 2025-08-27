
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { PLANS, PlanId } from '@/lib/plans';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, upgradeUserPlan } from '@/services/userService';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [isDowngrading, setIsDowngrading] = React.useState(false);

  React.useEffect(() => {
      if (user) {
          const fetchUserProfile = async () => {
              const profile = await getUserProfile(user.uid);
              setUserProfile(profile);
              setLoadingProfile(false);
          };
          fetchUserProfile();
      } else {
        setLoadingProfile(false);
      }
  }, [user]);
  
  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    if (planId === currentPlanId) return;

    if (planId === 'hobby') {
        setIsDowngrading(true);
        try {
            await upgradeUserPlan(user.uid, 'hobby');
            toast({
                title: 'Plan Changed',
                description: "You've been downgraded to the Hobby plan.",
            });
            // Force a profile refresh
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Downgrade Failed' });
        } finally {
            setIsDowngrading(false);
        }
        return;
    }

    router.push(`/payment/${planId}`);
  };

  const currentPlanId = userProfile?.planId || 'hobby';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8 items-center">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Find the perfect plan</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Start for free and scale up as you grow. All plans include our core features for event management.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
        {(Object.keys(PLANS) as PlanId[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrentPlan = planId === currentPlanId;
          const isDowngradeButton = planId === 'hobby' && currentPlanId !== 'hobby';

          return (
            <Card key={plan.name} className={`flex flex-col ${plan.recommended ? 'border-primary shadow-lg' : ''}`}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow gap-6">
                  <div>
                      <span className="text-4xl font-bold">
                        {plan.price === '0' ? 'Free' : format(parseInt(plan.price))}
                      </span>
                      {plan.price !== '0' && <span className="text-muted-foreground">/month</span>}
                  </div>
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isCurrentPlan || loadingProfile || (isDowngrading && planId === 'hobby')}
                  className={plan.variant === 'default' && !isCurrentPlan ? 'w-full bg-accent hover:bg-accent/90 text-accent-foreground' : 'w-full'}
                  variant={isCurrentPlan ? 'outline' : isDowngradeButton ? 'outline' : plan.variant as "default" | "outline"}
                >
                  {loadingProfile ? (
                      <Loader2 className="animate-spin" />
                  ) : isCurrentPlan ? (
                      'Current Plan'
                  ) : isDowngradeButton ? (
                      isDowngrading ? <><Loader2 className="mr-2 animate-spin"/> Downgrading...</> : 'Downgrade'
                  ) : (
                      plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
