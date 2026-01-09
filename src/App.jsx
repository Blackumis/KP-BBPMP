import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import AttendanceForm from './components/AttendanceForm';
import Login from './components/Login';
import DaftarKegiatan from './components/DaftarKegiatan';
import AttendanceList from './components/AttendanceList';
import { authAPI, eventsAPI } from './services/api';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'create' | 'public' | 'attendances'
  const [kegiatanList, setKegiatanList] = useState([]);
  const [activeKegiatan, setActiveKegiatan] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
            setIsAuthenticated(true);
            await loadEvents();
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          authAPI.logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Load events from backend
  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      if (response.success) {
        setKegiatanList(response.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Gagal memuat daftar kegiatan');
    }
  };

  // Handle login
  const handleLogin = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setView('dashboard');
    await loadEvents();
  };

  // Handle logout
  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setKegiatanList([]);
    setView('dashboard');
  };

  // Handle save config (create event)
  const handleSaveConfig = async (newConfig) => {
    try {
      await loadEvents(); // Reload events after creation
      setView('dashboard');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleCreateNew = () => {
    setView('create');
  };

  const handleViewAbsensi = (kegiatan) => {
    setActiveKegiatan(kegiatan);
    setView('public');
  };

  const handleViewAttendances = (kegiatan) => {
    setActiveKegiatan(kegiatan);
    setView('attendances');
  };

  const handleDeleteKegiatan = async (eventId) => {
    if (window.confirm("Apakah anda yakin ingin menghapus kegiatan ini?")) {
      try {
        await eventsAPI.delete(eventId);
        await loadEvents();
        if (activeKegiatan?.id === eventId) {
          setActiveKegiatan(null);
        }
      } catch (err) {
        alert('Gagal menghapus kegiatan: ' + err.message);
      }
    }
  };

  const handleActivateEvent = async (eventId) => {
    try {
      await eventsAPI.generateLink(eventId);
      await loadEvents();
      alert('Kegiatan berhasil diaktifkan!');
    } catch (err) {
      alert('Gagal mengaktifkan kegiatan: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
      <Header user={user} onLogout={handleLogout} isAuthenticated={isAuthenticated} />
      
      <main className="flex-grow p-4 md:p-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-4 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-800">✕</button>
          </div>
        )}
        
        {!isAuthenticated ? (
            <Login onLogin={handleLogin} />
        ) : (
            <>
                {view === 'dashboard' && (
                    <DaftarKegiatan 
                        kegiatanList={kegiatanList} 
                        onCreateNew={handleCreateNew} 
                        onViewAbsensi={handleViewAbsensi}
                        onViewAttendances={handleViewAttendances}
                        onDelete={handleDeleteKegiatan}
                        onActivate={handleActivateEvent}
                        onRefresh={loadEvents}
                    />
                )}

                {view === 'create' && (
                     <div className="relative">
                        <button 
                            onClick={() => setView('dashboard')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mb-4"
                        >
                            <span>&larr; Kembali ke Dashboard</span>
                        </button>
                        <AdminPanel onSaveConfig={handleSaveConfig} />
                     </div>
                )}

                {view === 'public' && activeKegiatan && (
                    <>
                         <div className="fixed bottom-4 right-4 z-50 flex gap-2"> 
                            <button 
                                onClick={() => setView('dashboard')}
                                className="px-4 py-2 rounded-full shadow-lg text-sm font-bold bg-white text-blue-800 border border-blue-200"
                            >
                                Dashboard View
                            </button>
                         </div>
                        <AttendanceForm eventId={activeKegiatan.id} onReset={() => setView('dashboard')} />
                    </>
                )}

                {view === 'attendances' && activeKegiatan && (
                    <AttendanceList 
                        event={activeKegiatan}
                        onBack={() => setView('dashboard')}
                    />
                )}
            </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
