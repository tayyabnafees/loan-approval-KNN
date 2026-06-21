import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CrediKNN - AI-Powered Loan Approval Prediction",
  description: "Assess applicant eligibility instantly using our optimized K-Nearest Neighbors (KNN) machine learning model.",
  keywords: ["loan approval", "machine learning", "KNN", "credit risk", "fastapi", "next.js"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
