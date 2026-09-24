import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  Receipt,
  Globe,
  ScrollText,
  Settings as SettingsIcon,
  Trophy,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'auto-pick'
  | 'new-bet'
  | 'bet-slip'
  | 'browser'
  | 'activity-log'
  | 'sportsbook'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingReviewCount,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'auto-pick' as NavTab,
      label: 'AI Auto Pick',
      icon: Sparkles,
      highlight: true,
    },
    { id: 'new-bet' as NavTab, label: 'Custom Instructions', icon: PlusCircle },
    {
      id: 'bet-slip' as NavTab,
      label: 'Bet Slip',
      icon: Receipt,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} ready` : undefined,
    },
    { id: 'browser' as NavTab, label: 'Browser', icon: Globe },
    { id: 'activity-log' as NavTab, label: 'Activity Log', icon: ScrollText },
    { id: 'sportsbook' as NavTab, label: 'NiceBet Sportsbook', icon: Trophy },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-zinc-900 border-r border-zinc-800 flex md:flex-col justify-between overflow-x-auto md:overflow-x-hidden md:h-[calc(100vh-61px)] p-3 md:p-4">
      <nav className="flex md:flex-col gap-1.5 w-full">
        <div className="hidden md:block px-3 py-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500 text-zinc-950 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="hidden md:block pt-4 border-t border-zinc-800/80">
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Safety Barrier Active
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Auto-execution is hard blocked. Bets require explicit human confirmation.
          </p>
        </div>
      </div>
    </aside>
  );
};
