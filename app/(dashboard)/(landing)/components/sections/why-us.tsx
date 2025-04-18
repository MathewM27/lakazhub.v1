import Link from 'next/link';
import { Home, Users, CheckCircle, ArrowRight, Check } from 'lucide-react';

const features = [
  {
    title: 'For Landlords',
    icon: Home,
    benefits: ['Manage multiple properties', 'customize availability', 'Chat with potential tenants'],
  },
  {
    title: 'For Tenants',
    icon: Users,
    benefits: ['Access filtered properties', 'Seamless inquiry with chat service', 'Access upto date listings'],
  },
  {
    title: 'Hassle-free Renting',
    icon: CheckCircle,
    benefits: ['No Agency fees', 'Communication chanel', 'Seamless experience'],
  },
];

export const WhyUsSection = () => {
  return (
    <section 
      id="why-us" 
      className="relative py-24 bg-black text-white overflow-hidden"
    >
      {/* Static pattern background instead of canvas */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px' 
        }}
      />
      
      {/* Section Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section heading with CSS animated underline */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white relative inline-block">
              Why join the community?
              <span className="absolute -bottom-2 left-0 h-1 bg-white/20 rounded-full w-full"></span>
            </h2>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto mt-6">
              We're redefining the rental experience by creating a seamless connection 
              between landlords and tenants.
            </p>
          </div>

          {/* Feature cards with simplified hover effects */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-black/80 rounded-2xl p-8 border border-white/10 shadow-xl hover:bg-black/90 transition duration-300"
              >
                {/* Icon with CSS background */}
                <div className="relative">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 relative z-10 overflow-hidden">
                    <feature.icon className="w-7 h-7 text-black relative z-10" />
                  </div>
                </div>
                
                {/* Content - Title only */}
                <h3 className="text-2xl font-semibold mb-6 text-white">{feature.title}</h3>
                
                {/* Benefits list */}
                <ul className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, i) => (
                    <li 
                      key={i}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1 flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-black" />
                      </span>
                      <span className="text-sm text-white/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Learn more link with animation */}
                <Link href={`#${feature.title.toLowerCase().replace(' ', '-')}`} className="group inline-flex items-center text-sm font-medium text-white">
                  Learn more
                  <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            ))}
          </div>
          
          {/* Bottom highlight card with centered text */}
          <div
            className="mt-16 backdrop-blur-sm bg-black border border-white/10 text-white rounded-2xl p-8 md:p-10 relative overflow-hidden"
          >
            {/* Static gradient background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-radial-gradient from-white/10 via-transparent to-transparent"></div>
              
              {/* Fine grid pattern */}
              <div className="absolute inset-0" 
                style={{ 
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                  backgroundSize: '20px 20px' 
                }}
              />
            </div>
            
            {/* Centered content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                Ready to transform your rental experience?
              </h3>
              
              <p className="text-white/80 text-lg">
                Join a community of property owners and tenants enjoying a seamless rental experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes gradientY {
          0% { transform: translateY(-100%); }
          40% { transform: translateY(0); }
          60% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }

        .animate-gradient-y {
          animation: gradientY 4s linear infinite;
        }
      `}</style>
    </section>
  );
};