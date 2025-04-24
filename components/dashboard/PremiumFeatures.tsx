import { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
}

interface PremiumFeaturesProps {
  role: "landlord" | "tenant";
  features: Feature[];
  highlightColor: string; // e.g. "yellow" or "blue"
  comingSoonText: string;
  badgeText: string;
}

export default function PremiumFeatures({
  role,
  features,
  highlightColor,
  comingSoonText,
  badgeText,
}: PremiumFeaturesProps) {
  const colorClass =
    highlightColor === "yellow"
      ? "bg-yellow-900/30 border-yellow-500/30 text-yellow-200"
      : "bg-blue-900/30 border-blue-500/30 text-blue-200";
  const badgeTextColor =
    highlightColor === "yellow"
      ? "text-yellow-200"
      : "text-blue-200";
  const gridHover =
    highlightColor === "yellow"
      ? "hover:border-yellow-400 hover:bg-yellow-950/30"
      : "hover:border-blue-400 hover:bg-blue-950/30";
  const iconColor =
    highlightColor === "yellow"
      ? "text-yellow-400 group-hover:text-yellow-300"
      : "text-blue-400 group-hover:text-blue-300";
  const groupHover =
    highlightColor === "yellow"
      ? "group-hover:text-yellow-200"
      : "group-hover:text-blue-200";

  return (
    <section className="min-h-[90vh] py-16 bg-black text-white flex items-center">
      <div className="container mx-auto px-4 max-w-3xl w-full">
        <div className="flex flex-col items-center mb-10">
          <div className={`flex items-center gap-2 mb-3 px-3 py-1 rounded-full ${colorClass}`}>
            {/* Icon is passed in features[0].icon for consistency */}
            {features[0]?.icon}
            <span className={`text-sm font-medium ${badgeTextColor}`}>{badgeText}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Unlock More with {role === "landlord" ? "Landlord" : "Tenant"} Premium
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`bg-white/5 rounded-xl p-8 border border-white/10 flex flex-col items-center justify-center gap-4 group transition-all duration-300 hover:scale-105 ${gridHover}`}
            >
              <span className={`w-10 h-10 ${iconColor} transition-transform duration-300`}>
                {feature.icon}
              </span>
              <h3 className={`font-semibold text-lg text-center transition-colors duration-300 ${groupHover}`}>
                {feature.title}
              </h3>
            </div>
          ))}
          <div className={`bg-white/10 rounded-xl p-8 border ${highlightColor === "yellow" ? "border-yellow-500/20" : "border-blue-500/20"} flex flex-col items-center justify-center gap-4 relative overflow-hidden group transition-all duration-300 hover:scale-105 ${gridHover}`}>
            {/* Lock icon for coming soon */}
            <span className={`w-10 h-10 ${iconColor} transition-transform duration-300`}>
              {/* Use a lock icon from lucide-react */}
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <h3 className={`font-semibold text-lg text-center transition-colors duration-300 ${groupHover}`}>More Coming Soon</h3>
          </div>
        </div>
        <div className="flex flex-col items-center mt-12">
          <span className={`mt-3 ${badgeTextColor}/80 text-xs`}>{comingSoonText}</span>
        </div>
      </div>
    </section>
  );
}
