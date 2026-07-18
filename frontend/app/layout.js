import "./globals.css";

export const metadata = {
  title: "Vidya AI — An AI Tutor for Every Kind of Student",
  description:
    "An adaptive AI learning companion for SDG 4: Quality Education. Built for the IBM SkillsBuild x BharatCare CSRbox x AICTE 'AI automation and Intelligent  solution' internship.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
