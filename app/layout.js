import './globals.css';

export const metadata = {
  title: 'BUU e-Leave | ระบบลาเรียนออนไลน์ มหาวิทยาลัยบูรพา',
  description: 'ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์ สรุปเวลาเรียน มหาวิทยาลัยบูรพา',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-neutral-50 text-neutral-900 antialiased selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
