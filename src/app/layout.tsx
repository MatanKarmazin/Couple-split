import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "CoupleSplit",
  description: "A private expense-splitting app for couples."
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("couplesplit-theme");
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
    const stored = localStorage.getItem("couplesplit-language");
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
