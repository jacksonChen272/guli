export const typographyScale = {
  display: 40,
  pageTitle: 34,
  mobilePageTitle: 28,
  sectionTitle: 24,
  cardTitle: 20,
  bodyLarge: 18,
  body: 16,
  mobileBody: 15,
  bodySmall: 14,
  label: 13,
  caption: 12,
  tableHeader: 14,
  tableCell: 15,
  badge: 13,
  metricLargeMin: 34,
  metricLargeMax: 40,
  metricMediumMin: 24,
  metricMediumMax: 28,
  drawerTitle: 22,
} as const

export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const

export const uiRules = {
  minimumTouchTarget: 44,
  quickQuestionTouchTarget: 48,
  dataTableRowHeight: 60,
  watchlistRowHeight: 80,
  cardPaddingDesktopMin: 20,
  cardPaddingMobileMin: 16,
  sectionGapMin: 24,
  supportedMobileWidth: 375,
  supportedLaptopWidth: 1366,
  reducedMotionSupported: true,
  riskUsesTextAndIcon: true,
  numericVariant: 'tabular-nums',
} as const
