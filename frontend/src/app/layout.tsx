import type { Metadata } from "next";
import { AuthProvider } from "./components/auth-context";
import "../styles/theme.css";
import "../styles/tailwind.css";

export const metadata: Metadata = {
  title: "Quizzify",
  description: "A professional and modern assessment platform",
  icons: {
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="11" fill="white"/%3E%3Cg transform="translate(0,1)"%3E%3Cpath d="M12 18c-1.5-1-3.2-1.5-5-1.5H5V5h2c1.8 0 3.5.5 5 1.5C13.5 5.5 15.2 5 17 5h2v11.5h-2c-1.8 0-3.5.5-5 1.5z" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/%3E%3Cline x1="12" y1="6.5" x2="12" y2="18" stroke="black" stroke-width="1.8"/%3E%3C/g%3E%3C/svg%3E',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
