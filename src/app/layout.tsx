import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  applicationName: "SplitNest",
  title: "SplitNest",
  description: "A private expense-splitting app for couples.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SplitNest",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1320" }
  ]
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("splitnest-theme");
    const mode = stored === "light" || stored === "dark" ? stored : "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "system" && prefersDark));
  } catch {
    document.documentElement.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
})();
`;

const languageScript = `
(() => {
  try {
    const stored = localStorage.getItem("splitnest-language");
    const language = stored === "he" || stored === "en"
      ? stored
      : navigator.language.toLowerCase().startsWith("he") ? "he" : "en";
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
  } catch {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
