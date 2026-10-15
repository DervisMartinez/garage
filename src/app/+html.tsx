import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is web-only and runs in Node.js during SSG/SSR builds.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Montserrat_400Regular';
                src: local('Montserrat-Regular'), local('Montserrat');
                font-weight: 400;
                font-style: normal;
              }
              @font-face {
                font-family: 'Montserrat_500Medium';
                src: local('Montserrat-Medium'), local('Montserrat');
                font-weight: 500;
                font-style: normal;
              }
              @font-face {
                font-family: 'Montserrat_600SemiBold';
                src: local('Montserrat-SemiBold'), local('Montserrat');
                font-weight: 600;
                font-style: normal;
              }
              @font-face {
                font-family: 'Montserrat_700Bold';
                src: local('Montserrat-Bold'), local('Montserrat');
                font-weight: 700;
                font-style: normal;
              }
              @font-face {
                font-family: 'Montserrat_800ExtraBold';
                src: local('Montserrat-ExtraBold'), local('Montserrat');
                font-weight: 800;
                font-style: normal;
              }
              html, body, #root {
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #111319;
                font-family: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              }
            `,
          }}
        />
        <title>GARAGE • Gestión Inteligente de Motocicletas</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
