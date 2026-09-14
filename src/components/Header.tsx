import React from 'react';
import { Volume2, Sparkles, Shield, ShieldCheck, LogIn, LogOut, User } from 'lucide-react';
import { UserProfile } from '../types';
import { AdminSession } from '../utils/authClient';

interface HeaderProps {
  onSelectSample: (text: string, accent: 'british' | 'australian') => void;
  onReset: () => void;
  currentUser: UserProfile | null;
  adminSession: AdminSession | null;
  onOpenAuth: () => void;
  onLogoutUser: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onReset,
  currentUser,
  adminSession,
  onOpenAuth,
  onLogoutUser,
  onOpenAdmin,
}) => {
  return (
    <header className="border-b border-stone-200 bg-stone-50/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-sm shrink-0">
            <Volume2 className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 truncate">
                Accent Voice Generator
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/60 uppercase tracking-wider shrink-0">
                Studio
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300/80 shadow-2xs shrink-0">
                Created by Ramjan Ali
              </span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">
              British & Australian accents • Male & Female artists • Custom word timeout pacing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Admin Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            title={adminSession ? 'Open Studio Admin Panel' : 'Administrator Login'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              adminSession
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold shadow-2xs hover:bg-amber-200'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300 hover:text-stone-900'
            }`}
          >
            {adminSession ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold">Admin Panel</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-stone-500" />
                <span>Admin Login</span>
              </>
            )}
          </button>

          {/* User Auth Status / Sign In Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-stone-100/90 border border-stone-300/90 rounded-lg p-1 sm:pl-2.5 sm:pr-1.5">
              <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[180px] truncate">
                {currentUser.provider === 'google' ? (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                  </svg>
                ) : (
                  <User className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                )}
                <span className="text-xs font-medium text-stone-800 truncate" title={currentUser.email}>
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogoutUser}
                title="Log out from account"
                className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onReset}
            type="button"
            className="hidden sm:inline-flex text-xs font-medium text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-lg hover:bg-stone-200/70 transition-colors border border-transparent hover:border-stone-300 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};

