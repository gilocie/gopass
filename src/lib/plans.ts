
export type PlanId = 'hobby' | 'pro' | 'proPlus';

export interface Plan {
  name: string;
  price: string; // Price is always in BASE_CURRENCY (USD)
  description: string;
  features: string[];
  limits: {
    maxEvents: number;
    maxTicketsPerEvent: number;
    maxBenefits: number;
    maxOrganizations: number;
    watermark: boolean;
    support: boolean;
  };
  cta: string;
  variant: "default" | "outline";
  recommended?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  hobby: {
    name: "Hobby",
    price: "0",
    description: "For personal projects and getting started.",
    features: [
      "1 event",
      "5 tickets per event",
      "Up to 5 benefits per ticket",
      "1 Organization Page",
      "Tickets include 'GoPass' watermark",
      "Community support",
    ],
    limits: {
        maxEvents: 1,
        maxTicketsPerEvent: 5,
        maxBenefits: 5,
        maxOrganizations: 1,
        watermark: true,
        support: false,
    },
    cta: "Start for Free",
    variant: "outline",
  },
  pro: {
    name: "Pro",
    price: "2",
    description: "For professional organizers and growing businesses.",
    features: [
      "5 events",
      "Up to 8 tickets per event",
      "Up to 8 benefits per ticket",
      "2 Organization Pages",
      "No ticket watermark",
      "Email support",
    ],
    limits: {
        maxEvents: 5,
        maxTicketsPerEvent: 8,
        maxBenefits: 8,
        maxOrganizations: 2,
        watermark: false,
        support: true,
    },
    cta: "Upgrade to Pro",
    variant: "default",
    recommended: true,
  },
  proPlus: {
    name: "Pro Plus",
    price: "5",
    description: "For large-scale events and dedicated needs.",
    features: [
      "Unlimited events",
      "Unlimited tickets",
      "Unlimited benefits",
      "Unlimited Organization Pages",
      "No ticket watermark",
      "24/7 priority support",
    ],
    limits: {
        maxEvents: Infinity,
        maxTicketsPerEvent: Infinity,
        maxBenefits: Infinity,
        maxOrganizations: Infinity,
        watermark: false,
        support: true,
    },
    cta: "Go Pro Plus",
    variant: "outline",
  },
};
