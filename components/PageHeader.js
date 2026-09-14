export default function PageHeader({ icon: Icon, eyebrow, title, subtitle, action }) {
  return (
    <div className="bg-gradient-to-r from-purple-600/15 via-white/80 to-white/60 dark:from-purple-950/40 dark:via-slate-900/80 dark:to-slate-900/60 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
      <div className="flex items-start gap-4 min-w-0">
        {Icon && (
          <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-[#7749BC] text-white items-center justify-center shrink-0 shadow-md shadow-purple-800/25 ring-2 ring-purple-300/30">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full">
              {eyebrow}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-2 truncate">
            {title}
          </h1>
          {subtitle && <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
}
