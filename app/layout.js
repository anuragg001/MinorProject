import "./globals.css";

export const metadata ={
  title: "Spott",
  description: "Discover and create amazing events",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={``}>
      {/* Header */}

        {children}

        {/* Footer */}
      </body>
    </html>
  );
}
