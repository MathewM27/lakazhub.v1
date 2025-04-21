"use client";

import { Sparkles, Clock, Bell, ThumbsUp } from "lucide-react";
import PremiumFeatures from "@/components/dashboard/PremiumFeatures";

export default function TenantPremiumFeatures() {
  return (
    <PremiumFeatures
      role="tenant"
      highlightColor="blue"
      badgeText="Premium Features"
      comingSoonText="Tenant Premium launching soon"
      features={[
        { icon: <Clock className="w-10 h-10" />, title: "Priority Access" },
        { icon: <Bell className="w-10 h-10" />, title: "Smart Alerts" },
        { icon: <ThumbsUp className="w-10 h-10" />, title: "Personalized Recommendations" },
      ]}
    />
  );
}