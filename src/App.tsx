import { SerialProvider } from './contexts/SerialContext';
import { Terminal } from './components/Terminal';
import { Settings } from './components/Settings';
import { Lens } from './components/Lens';
import { Adapter } from "./components/Adapter.tsx";

export default function App() {
  return (
    <SerialProvider>
      <div className="h-screen p-6 bg-slate-50 text-slate-900">
        <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="flex flex-col h-full">
            <Lens />

            <Terminal />
          </div>

          <div className="mx-auto h-full grid grid-cols-1 gap-6">
            <div className="flex flex-col h-full">
              <Adapter />

              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Settings</h2>
                </div>
                <div className="flex-1 min-h-0">
                  <Settings />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SerialProvider>
  );
}
