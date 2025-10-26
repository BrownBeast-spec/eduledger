import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduLedger - Certificate Management System",
  description: "Blockchain-based certificate management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    background: '#ffffff',
                    foreground: '#000000',
                    primary: '#000000',
                    'primary-foreground': '#ffffff',
                    secondary: '#f5f5f5',
                    'secondary-foreground': '#000000',
                    muted: '#f5f5f5',
                    'muted-foreground': '#666666',
                    accent: '#f5f5f5',
                    'accent-foreground': '#000000',
                    destructive: '#ef4444',
                    'destructive-foreground': '#ffffff',
                    border: '#e5e5e5',
                    input: '#e5e5e5',
                    ring: '#000000',
                    card: '#ffffff',
                    'card-foreground': '#000000',
                    popover: '#ffffff',
                    'popover-foreground': '#000000',
                  }
                }
              }
            }
          `}
        </script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}