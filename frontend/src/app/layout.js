import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CrowdTrackerProvider } from "@/components/crowd/CrowdTrackerProvider";

export const metadata = {
  title: "Empty Bottle",
  description: "Campus drinking water management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <CrowdTrackerProvider>{children}</CrowdTrackerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
