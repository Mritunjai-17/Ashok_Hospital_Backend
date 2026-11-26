import './globals.css';

export const metadata = {
  title: 'Dr. Abhinav · Mental Health Admin Panel & CRM',
  description:
    'Admin panel and CRM for managing appointment enquiry submissions, slot availability, and patient notifications.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
