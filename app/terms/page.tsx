import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-blue-400">Terms of Service</h1>
        <div className="space-y-8 text-white/90">
          <p>
            Welcome to LakazHub. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">1. Acceptance of Terms</h2>
            <p>
              By using LakazHub, you agree to comply with and be legally bound by these terms, whether or not you become a registered user.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">3. Use of the Platform</h2>
            <p>
              You agree to use LakazHub only for lawful purposes and in accordance with these Terms. You may not use our platform to post or transmit any material that is unlawful, abusive, or otherwise objectionable.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">4. Listings and Content</h2>
            <p>
              Landlords are responsible for the accuracy of property listings. LakazHub does not guarantee the accuracy, completeness, or quality of any listings or content posted by users.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">5. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to LakazHub at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">6. Limitation of Liability</h2>
            <p>
              LakazHub is provided &quot;as is&quot; and without warranties of any kind. We are not liable for any damages arising from your use of the platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">7. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of LakazHub after changes constitutes your acceptance of the new Terms.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">8. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:support@lakazhub.com" className="text-blue-400 underline">
                support@lakazhub.com
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
