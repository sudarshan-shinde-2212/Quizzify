import type { Metadata } from "next";
import { AuthProvider } from "./components/auth-context";
import "../styles/theme.css";
import "../styles/tailwind.css";

export const metadata: Metadata = {
  title: "Quizzify",
  description: "A professional and modern assessment platform",
  icons: {
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/%3E%3Cpath d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/%3E%3C/svg%3E',
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
