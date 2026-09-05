import { useState, useEffect, useRef } from 'react';
import { db } from '../db/db';

export function SyncButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState<string | undefined>();
  const [phase, setPhase] = useState<string>('initial');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userSub = db.cloud.currentUser.subscribe((u) => {
      setIsLoggedIn(u?.isLoggedIn ?? false);
      setEmail(u?.email);
    });
    const syncSub = db.cloud.syncState.subscribe((s) => {
      setPhase(s?.phase ?? 'initial');
    });
    return () => {
      userSub.unsubscribe();
      syncSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const iconClass = isLoggedIn
    ? phase === 'in-sync'
      ? 'text-blue-200'
      : phase === 'error' || phase === 'offline'
        ? 'text-yellow-300'
        : 'text-blue-300 animate-pulse'
    : 'text-blue-600';

  function handleClick() {
    if (!isLoggedIn) {
      db.cloud.login();
    } else {
      setShowMenu(m => !m);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleClick}
        title={isLoggedIn ? `Synced · ${email}` : 'Sign in to sync'}
        className={`text-base leading-none transition-colors hover:text-white ${iconClass}`}
      >
        ☁
      </button>

      {showMenu && isLoggedIn && (
        <div className="absolute left-0 top-7 bg-white rounded-xl shadow-lg border border-gray-100 p-3 min-w-[180px] z-50">
          <p className="text-xs font-medium text-gray-700 truncate mb-0.5">{email}</p>
          <p className="text-xs text-gray-400 capitalize mb-3">{phase.replace(/-/g, ' ')}</p>
          <button
            onClick={() => { db.cloud.logout(); setShowMenu(false); }}
            className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors py-1"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
