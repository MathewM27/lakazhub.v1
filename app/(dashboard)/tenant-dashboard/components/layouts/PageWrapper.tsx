import Navigation from "../navigation/Navbar";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
};
