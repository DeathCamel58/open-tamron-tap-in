import { SerialProvider } from './contexts/SerialContext';
import { Terminal } from './components/Terminal';
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
            </div>
          </div>
        </div>
      </div>
    </SerialProvider>
  );
}
