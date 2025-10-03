// Reusable Tailwind component classes for consistent styling

export const styles = {
  // Layout
  container: 'min-h-screen bg-slate-900',
  sidebar:
    'fixed top-0 bottom-0 left-0 w-60 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col overflow-y-auto z-50 shadow-xl',
  content: 'ml-60 p-5 w-full min-h-screen bg-slate-900',

  // Cards
  card: 'bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1',
  cardPadding: 'p-6',

  // Buttons
  btnPrimary:
    'text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-400/25 transition-all duration-300',
  btnSecondary:
    'bg-slate-700 border border-slate-600 text-slate-200 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-slate-600 hover:border-emerald-500',
  btnOutline:
    'border border-emerald-500 text-emerald-400 px-3 py-1 rounded-lg transition-colors hover:bg-emerald-500/10',
  btnDanger: 'border border-red-500 text-red-400 px-3 py-1 rounded-lg transition-colors hover:bg-red-500/10',

  // Forms
  input:
    'w-full bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-lg transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/25 focus:outline-none',
  label: 'block text-sm font-medium text-slate-300 mb-2',

  // Text
  heading1: 'text-4xl font-bold bg-clip-text text-transparent',
  heading2: 'text-3xl font-bold bg-clip-text text-transparent',
  heading3: 'text-2xl font-bold text-white',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  textMuted: 'text-slate-500',
  textSuccess: 'text-green-400',
  textError: 'text-red-400',
  textWarning: 'text-yellow-400',

  // Status badges
  badgeSuccess: 'bg-green-500 text-green-100',
  badgeError: 'bg-red-500 text-red-100',
  badgeWarning: 'bg-yellow-500 text-yellow-100',
  badgeInfo: 'bg-blue-500 text-blue-100',
  badgeSecondary: 'bg-slate-500 text-slate-100',

  // Navigation
  navLink:
    'flex items-center px-5 py-3 text-slate-300 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-300 border-l-4 border-transparent hover:border-emerald-400',
  navLinkActive: 'flex items-center px-5 py-3 text-emerald-400 bg-emerald-400/20 border-l-4 border-emerald-400',
  navGroupTitle: 'text-xs text-slate-500 px-5 mb-3 uppercase tracking-wider font-semibold',

  // Tables
  table: 'w-full',
  tableHeader: 'text-left p-4 text-slate-300 font-medium border-b border-slate-700/50',
  tableRow: 'border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors',
  tableCell: 'p-4 text-white',

  // Alerts
  alertSuccess: 'bg-green-900/20 border border-green-700/50 rounded-lg p-3',
  alertError: 'bg-red-900/20 border border-red-700/50 rounded-lg p-3',
  alertWarning: 'bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3',
  alertInfo: 'bg-blue-900/20 border border-blue-700/50 rounded-lg p-3',

  // Loading
  spinner: 'animate-spin text-emerald-400',
  loadingContainer: 'flex items-center justify-center min-h-96',

  // Spacing
  spacing: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  },
};

// Helper functions for dynamic classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getStatusBadgeClass = (status) => {
  const statusMap = {
    success: styles.badgeSuccess,
    error: styles.badgeError,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
    secondary: styles.badgeSecondary,
  };
  return statusMap[status] || styles.badgeSecondary;
};
