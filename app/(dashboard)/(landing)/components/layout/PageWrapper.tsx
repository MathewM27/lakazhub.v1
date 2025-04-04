import { Navbar } from "../navigation/Navbar";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
};
