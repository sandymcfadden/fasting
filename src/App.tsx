import { useState } from 'react';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { ScheduleList } from './components/ScheduleList';
import { DayDetail } from './components/DayDetail';

type View = 'calendar' | 'schedules';

function App() {
  const [view, setView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header view={view} onViewChange={setView} />
      <main className="max-w-2xl mx-auto px-4 py-5">
        {view === 'calendar' ? (
          <CalendarView onDayClick={setSelectedDate} />
        ) : (
          <ScheduleList />
        )}
      </main>
      {selectedDate && (
        <DayDetail date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}

export default App;
