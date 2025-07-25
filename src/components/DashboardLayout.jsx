// src/components/DashboardLayout.jsx
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-6 p-2 bg-gray-50 overflow-auto">
        <main className="w-full min-h-full rounded-3xl p-2 overflow-auto" style={{ backgroundColor: 'var(--color-primario)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}