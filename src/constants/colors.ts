export const DarkTheme = {
  surface: '#000000',                     // Apple True Black
  surfaceContainerLowest: '#0c0d10',
  surfaceContainerLow: '#1c1c1e',         // Apple Secondary Grouped Background
  surfaceContainer: '#2c2c2e',            // Apple Tertiary Grouped Background
  surfaceContainerHigh: '#3a3a3c',        // Apple Quaternary Grouped Background / Modal
  surfaceContainerHighest: '#48484a',
  surfaceBright: '#2c2c2e',
  onSurface: '#f2f2f7',                   // Apple Primary Label
  onSurfaceVariant: '#8e8e93',            // Apple Secondary Label
  primary: '#0a84ff',                     // Apple iOS System Blue (Dark)
  primaryContainer: '#0a84ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffffff',
  secondary: '#30d158',                   // Apple System Green
  secondaryContainer: '#30d158',
  onSecondary: '#ffffff',
  tertiary: '#30d158',                    // Apple Health Green
  tertiaryContainer: '#1c3823',
  onTertiary: '#30d158',
  error: '#ff453a',                       // Apple System Red (Dark)
  errorContainer: '#3d1214',
  onError: '#ffffff',
  onErrorContainer: '#ffb3ae',
  surfaceTint: '#0a84ff',
  outline: '#48484a',
  outlineVariant: 'rgba(255, 255, 255, 0.1)', // Apple Hairline
  statusBar: 'light-content' as const,
};

export const LightTheme = {
  surface: '#f2f2f7',                     // Apple System Grouped Background
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#ffffff',         // Apple Crisp White Card
  surfaceContainer: '#e5e5ea',            // Apple System Gray 5
  surfaceContainerHigh: '#d1d1d6',        // Apple System Gray 4 / Modal
  surfaceContainerHighest: '#c7c7cc',
  surfaceBright: '#ffffff',
  onSurface: '#000000',                   // Apple Primary Label
  onSurfaceVariant: '#6c6c70',            // Apple Secondary Label
  primary: '#007aff',                     // Apple iOS System Blue (Light)
  primaryContainer: '#007aff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffffff',
  secondary: '#34c759',                   // Apple System Green
  secondaryContainer: '#34c759',
  onSecondary: '#ffffff',
  tertiary: '#34c759',                    // Apple Health Green
  tertiaryContainer: '#e8faee',
  onTertiary: '#1d7032',
  error: '#ff3b30',                       // Apple System Red (Light)
  errorContainer: '#ffe5e3',
  onError: '#ffffff',
  onErrorContainer: '#a81812',
  surfaceTint: '#007aff',
  outline: '#c7c7cc',
  outlineVariant: 'rgba(0, 0, 0, 0.08)',  // Apple Hairline
  statusBar: 'dark-content' as const,
};

export type AppThemeColors = Omit<typeof DarkTheme, 'statusBar'> & {
  statusBar: 'light-content' | 'dark-content';
};
