import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-black text-white py-16 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-blue-400">Privacy Policy</h1>
        <div className="space-y-8 text-white/90">
          <p>
            LakazHub is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.
          </p>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">1. Information We Collect</h2>
            <p>
              We collect information you provide when you register, create a listing, or communicate with other users. This may include your name, email, phone number, and property details.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">2. How We Use Your Information</h2>
            <p>
              We use your information to provide and improve our services, facilitate communication between users, and ensure the security of our platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">3. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share information with service providers as necessary to operate LakazHub, or if required by law.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">5. Cookies</h2>
            <p>
              LakazHub may use cookies to enhance your experience. You can control cookies through your browser settings.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">6. Your Rights</h2>
            <p>
              You may access, update, or delete your personal information by contacting us. We will respond to your request as soon as possible.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We encourage you to review it regularly.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">8. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:futurexdesigns.info@gmail.com" className="text-blue-400 underline">
                futurexdesigns.info@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
        <div className="mt-12">
          <Link href="/" className="text-blue-400 underline hover:text-blue-300 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
