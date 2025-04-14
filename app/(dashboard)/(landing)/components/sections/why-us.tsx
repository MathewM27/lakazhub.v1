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
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white relative inline-block opacity-0 animate-fade-in">
              Why join the community?
              <span className="absolute -bottom-2 left-0 h-1 bg-white/20 rounded-full w-0 animate-expand-width"></span>
            </h2>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto mt-6 opacity-0 animate-fade-in delay-200">
              We&apos;re redefining the rental experience by creating a seamless connection 
              between landlords and tenants.
            </p>
          </div>

          {/* Feature cards with CSS hover effects */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-black/80 rounded-2xl p-8 border border-white/10 shadow-xl overflow-hidden opacity-0 animate-slide-up hover:translate-y-[-5px] transition-transform duration-300"
                style={{animationDelay: `${(index + 1) * 150}ms`}}
              >
                {/* Card background effect */}
                <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Icon with CSS background */}
                <div className="relative">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-200 animate-gradient-y"></div>
                    <feature.icon className="w-7 h-7 text-black relative z-10" />
                  </div>
                </div>
                
                {/* Content - Title only */}
                <h3 className="text-2xl font-semibold mb-6 text-white">{feature.title}</h3>
                
                {/* Benefits list with staggered animation */}
                <ul className="space-y-3 mb-6">
                  {feature.benefits.map((benefit, i) => (
                    <li 
                      key={i}
                      className="flex items-start gap-2 opacity-0 animate-slide-in"
                      style={{animationDelay: `${(index * 100) + (i * 100) + 500}ms`}}
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
            className="mt-16 backdrop-blur-sm bg-black border border-white/10 text-white rounded-2xl p-8 md:p-10 relative overflow-hidden opacity-0 animate-fade-in delay-600"
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
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white opacity-0 animate-fade-in delay-700">
                Ready to transform your rental experience?
              </h3>
              
              <p className="text-white/80 text-lg opacity-0 animate-fade-in delay-800">
                Join a community of property owners and tenants enjoying a seamless rental experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes expandWidth {
          0% { width: 0; }
          100% { width: 100%; }
        }

        @keyframes gradientY {
          0% { transform: translateY(-100%); }
          40% { transform: translateY(0); }
          60% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }

        .animate-fade-in {
          animation: fadeIn 0.7s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.7s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.5s ease-out forwards;
        }

        .animate-expand-width {
          animation: expandWidth 0.8s ease-out forwards;
          animation-delay: 0.5s;
        }

        .animate-gradient-y {
          animation: gradientY 4s linear infinite;
        }

        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
      `}</style>
    </section>
  );
};