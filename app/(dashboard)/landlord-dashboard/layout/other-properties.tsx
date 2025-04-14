import { 
  TrendingUp,
  Users,
  Sparkles,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  Crown,
  Building,
  Lock,
  Share2,
  Star
} from "lucide-react";

import { AnimatedSection } from "./animated-section";
import { AnalyticsChart } from "./analytics-chart";

export default function OtherProperties() {
  // Sample analytics data
  const analyticsData = [
    { value: 52, label: "Day" },
    { value: 128, label: "Week" },
    { value: 348, label: "Month" }
  ];

  // Sample chart bars for visualization
  const bars = [45, 75, 65, 90, 42, 58, 70, 35, 65, 80, 55, 60];

  return (
    <section className="py-16 bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-full bg-white/5"
            style={{ left: `${i * 10}%` }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-white/70 text-sm font-medium">Coming Soon</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white animate-slideUp">
              Premium Features & Analytics
            </h2>

            <p className="text-base text-white/70 max-w-2xl mx-auto animate-slideUp animation-delay-100">
              Unlock advanced insights and promotional tools to maximize your rental properties&apos; potential
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analytics Dashboard Preview */}
            <AnimatedSection className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-lg font-medium">Property Analytics</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60 bg-white/10 rounded-full px-3 py-1">
                    <Lock className="w-3 h-3" />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {analyticsData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 text-center animate-fadeScale animation-delay-300"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="flex justify-center mb-2">
                        {index === 0 ? (
                          <Eye className="h-5 w-5 text-white" />
                        ) : index === 1 ? (
                          <MousePointerClick className="h-5 w-5 text-white" />
                        ) : (
                          <Users className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white">{item.value}</p>
                      <p className="text-xs text-white/60">{index === 0 ? "Views" : index === 1 ? "Clicks" : "Inquiries"} / {item.label}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white/80 text-sm">Traffic Overview</h4>
                    <div className="text-white/60 text-xs bg-white/10 rounded-full px-2 py-1">Last 12 weeks</div>
                  </div>
                  
                  <AnalyticsChart bars={bars} />
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-white text-sm">Conversion Rate</span>
                    </div>
                    <span className="text-white text-sm">+12.5%</span>
                  </div>
                  <p className="text-xs text-white/60">View to inquiry conversion has improved by 12.5% in the last 30 days</p>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-white/60 text-xs">Updated in real-time</div>
                <button
                  className="bg-white/10 hover:bg-white/15 text-white text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105 active:scale-98 flex items-center gap-1.5"
                >
                  <span>Full Analytics</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </AnimatedSection>
            
            {/* Featured Property Promotion */}
            <AnimatedSection
              delay={0.2}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-lg font-medium">Featured Property</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60 bg-white/10 rounded-full px-3 py-1">
                    <Crown className="w-3 h-3 text-white" />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="mb-6 bg-white/5 rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Promoted Listings</h4>
                      <p className="text-white/70 text-xs">Front page visibility for your properties</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {[
                      "Featured position on homepage",
                      "Highlighted in search results",
                      "4x more views than standard listings",
                      "Priority in tenant recommendations"
                    ].map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-white/80 animate-slideRight"
                        style={{ animationDelay: `${600 + index * 100}ms` }}
                      >
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: `${index * 200}ms` }} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <Building className="w-5 h-5 text-white" />
                      <span className="text-xs text-white/60">Average</span>
                    </div>
                    <p className="text-xl font-bold text-white">43 days</p>
                    <p className="text-xs text-white/60">Time to rent (standard)</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <Building className="w-5 h-5 text-white" />
                      <span className="text-xs text-white/60">Featured</span>
                    </div>
                    <p className="text-xl font-bold text-white">16 days</p>
                    <p className="text-xs text-white/60">Time to rent (featured)</p>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm">Real-time visibility status</span>
                    <div className="text-xs text-white rounded-full bg-black border border-white/20 px-2 py-0.5">
                      Coming Soon
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-2/3 bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full bg-white w-0"></div>
                    </div>
                    <div className="text-xs text-white/60">0/3 features</div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/60 text-xs">Share with your team</span>
                </div>
                <button
                  className="bg-white text-black text-xs py-1.5 px-3 rounded-md transition-transform hover:scale-105 active:scale-98 flex items-center gap-1.5 opacity-70 cursor-not-allowed"
                >
                  <span>Activate Premium</span>
                  <Lock className="w-3 h-3" />
                </button>
              </div>
            </AnimatedSection>
          </div>

          {/* Coming Soon Badge */}
          <div className="mt-12 text-center animate-fadeIn animation-delay-800">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-white/80 text-sm">Premium features launching soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}