import type { Metadata } from "next";
import { AuthProvider } from "./components/auth-context";
import "../styles/theme.css";
import "../styles/tailwind.css";

export const metadata: Metadata = {
  title: "Quizzify",
  description: "A professional and modern assessment platform",
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
