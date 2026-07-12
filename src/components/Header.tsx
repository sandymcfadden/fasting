type View = 'calendar' | 'schedules';

interface Props {
  view: View;
  onViewChange: (v: View) => void;
}

export function Header({ view, onViewChange }: Props) {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱</span>
          <span className="font-semibold text-lg tracking-tight">Fasting Calendar</span>
        </div>
        <nav className="flex gap-1 bg-blue-700 rounded-lg p-1">
          <button
            onClick={() => onViewChange('calendar')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === 'calendar' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => onViewChange('schedules')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              view === 'schedules' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
            }`}
          >
            Schedules
          </button>
        </nav>
      </div>
    </header>
  );
}
