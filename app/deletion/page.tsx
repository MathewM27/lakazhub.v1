import Link from "next/link";

export default function DataDeletionPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-blue-400">Data Deletion Instructions</h1>
        <div className="space-y-8 text-white/90">
          <p>
            If you wish to delete your account and all associated data from LakazHub, please follow the instructions below.
          </p>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">How to Request Data Deletion</h2>
            <p>
              Send an email to{" "}
              <a href="mailto:futurexdesigns.info@gmail.com" className="text-blue-400 underline">
                futurexdesigns.info@gmail.com
              </a>{" "}
              from the email address associated with your LakazHub account. Please include &quot;Data Deletion Request&quot; in the subject line.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">What Happens Next?</h2>
            <p>
              Once we receive your request, we will verify your identity and process the deletion of your account and all related data within 30 days. You will receive a confirmation email once the process is complete.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-white">Contact</h2>
            <p>
              If you have any questions about data deletion, please contact us at{" "}
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