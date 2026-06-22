import { ReactNode } from "react";
import { Navbar } from "./navbar";

export function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-6">{children}</main>
    </div>
  );
}
