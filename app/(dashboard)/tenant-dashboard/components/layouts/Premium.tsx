"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { 
  Clock,
  LineChart,
  Bell,
  Sparkles,
  Building,
  Compass,
  School,
  Train,
  Zap,
  Lock,
  ArrowUpRight,
  ThumbsUp,
  BarChart2,
  ScanSearch,
  Layers,
  ChevronRight
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { 
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function PremiumFeatures() {
  const controlsLeft = useAnimation();
  const controlsRight = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  
  useEffect(() => {
    if (inView) {
      controlsLeft.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
      });
      controlsRight.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut", delay: 0.2 }
      });
    }
  }, [inView, controlsLeft, controlsRight]);

  // Sample price trend data - update the structure to work with recharts
  const priceTrends = [
    { month: "Jan", price: 30 },
    { month: "Feb", price: 28 },
    { month: "Mar", price: 32 },
    { month: "Apr", price: 35 },
    { month: "May", price: 38 },
    { month: "Jun", price: 42 },
    { month: "Jul", price: 45 },
    { month: "Aug", price: 40 },
  ];

  // Sample neighborhood data
  const neighborhoodData = [
    { label: "Schools", value: 8, icon: School },
    { label: "Transport", value: 12, icon: Train },
    { label: "Restaurants", value: 24, icon: Building }
  ];

  return (
    <section ref={ref} className="py-16 bg-black relative overflow-hidden">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-12 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/10 border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-white/70 text-sm font-medium">Coming Soon</span>
            </motion.div>

            <motion.h2
              className="text-2xl md:text-3xl font-bold mb-3 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Tenant Premium Features
            </motion.h2>

            <motion.p
              className="text-base text-white/70 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Discover your ideal home faster with advanced search tools, market insights, and exclusive early access
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Early Access & Search Features */}
            <motion.div
              animate={controlsLeft}
              initial={{ opacity: 0, y: 30 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-lg font-medium">Priority Access & Smart Search</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60 bg-white/10 rounded-full px-3 py-1">
                    <Lock className="w-3 h-3" />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {/* Priority Access Card */}
                <div className="bg-white/5 rounded-lg p-5 border border-white/10 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Priority Access to Listings</h4>
                      <p className="text-white/70 text-xs">Get ahead of the competition by 48 hours</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-white text-sm">Early Access Properties</span>
                      </div>
                      <span className="text-white text-xs bg-white/10 rounded-full px-2 py-1">48h Exclusive</span>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                          className="flex items-center justify-between bg-white/5 rounded-md p-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                              <Building className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white text-xs">Premium Property #{i}</p>
                              <p className="text-white/60 text-xs">Grand Baie • 2 bed</p>
                            </div>
                          </div>
                          <div className="text-blue-400 text-xs font-medium">Early Access</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Smart Search Features */}
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <ScanSearch className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Smart Search & Alerts</h4>
                      <p className="text-white/70 text-xs">Personalized recommendations based on your preferences</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="bg-black/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-blue-400" />
                        <p className="text-white text-sm">Smart Alerts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </div>
                        <p className="text-white/70 text-xs">Get notifications when properties match your criteria</p>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="bg-black/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-4 h-4 text-blue-400" />
                        <p className="text-white text-sm">Personalized Recommendations</p>
                      </div>
                      <div className="text-white/70 text-xs">
                        Smart suggestions based on your browsing history and preferences
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-white/60 text-xs">Get early access to exclusive properties</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/10 hover:bg-white/15 text-white text-xs py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <span>Learn More</span>
                  <ArrowUpRight className="w-3 h-3" />
                </motion.button>
              </div>
            </motion.div>
            
            {/* Market Insights & Comparison Tools */}
            <motion.div
              animate={controlsRight}
              initial={{ opacity: 0, y: 30 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-white text-lg font-medium">Market Insights & Comparison</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60 bg-white/10 rounded-full px-3 py-1">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Premium</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {/* Price Trends Graph - Replace with recharts line chart */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Price Trends</span>
                    </div>
                    <span className="text-white/60 text-xs bg-white/10 rounded-full px-2 py-1">Grand Baie, Mauritius</span>
                  </div>
                  
                  <div className="h-48 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={priceTrends}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                        />
                        <YAxis 
                          tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                          tickFormatter={(value) => `${value}K`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.9)', 
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            color: 'black'
                          }}
                          labelStyle={{ color: 'rgba(0,0,0,0.8)' }}
                          formatter={(value) => [`Rs ${value}K`, 'Price']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#ffffff" 
                          strokeWidth={2}
                          dot={{ fill: '#ffffff', r: 4, strokeWidth: 1 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <p className="text-white/70 text-xs">Average rental prices over time (Rs '000s/month)</p>
                  </div>
                </div>
                
                {/* Neighborhood Insights */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Neighborhood Insights</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {neighborhoodData.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                        className="bg-black/30 rounded-lg p-3 text-center"
                      >
                        <item.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-white font-bold text-lg">{item.value}</p>
                        <p className="text-white/60 text-xs">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Property Comparison Tool */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Property Comparison</span>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-black/30 rounded-lg p-3 mb-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 text-xs">Compare up to 3 properties side by side</span>
                      <div className="text-xs text-white/70 rounded-full bg-black border border-white/20 px-2 py-0.5">
                        Premium
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-white/10 rounded-md p-2 flex flex-col items-center">
                          <div className="w-full h-16 bg-gradient-to-b from-white/5 to-white/10 rounded-md mb-2 flex items-center justify-center">
                            <Building className="w-5 h-5 text-white/40" />
                          </div>
                          <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
                          <div className="w-1/2 h-2 bg-white/10 rounded-full mt-1"></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
              
              <div className="px-5 py-4 border-t border-white/10 flex justify-between items-center">
                <div className="text-white/60 text-xs">Make smarter rental decisions with data</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 opacity-70 cursor-not-allowed"
                >
                  <span>Coming Soon</span>
                  <Lock className="w-3 h-3" />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Coming Soon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-white/80 text-sm">Premium features for tenants launching soon</span>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}