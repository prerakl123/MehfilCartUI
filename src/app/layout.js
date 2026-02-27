import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata = {
  title: "MehfilCart — Order Together, Dine Together",
  description:
    "MehfilCart is a collaborative food ordering platform for restaurants. Scan a QR code, join a table, and order together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#6C3CE1" />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
