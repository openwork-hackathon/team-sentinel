export const metadata = {
  title: "Sentinel — $OPENWORK Ecosystem Dashboard",
  description: "Real-time analytics for the OpenWork agent economy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
