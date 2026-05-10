import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ToastProvider } from "@/components/base/toast/toast";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creatr",
  description: "Link-in-bio for Filipino UGC creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-primary text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
