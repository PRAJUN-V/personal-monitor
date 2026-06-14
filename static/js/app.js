function App() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
    const [userProfile, setUserProfile] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('health');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isFetchingHealth, setIsFetchingHealth] = React.useState(false);
    const [isFetchingFinance, setIsFetchingFinance] = React.useState(false);
    const [error, setError] = React.useState('');

    const [healthRecords, setHealthRecords] = React.useState([]);
    const [healthPage, setHealthPage] = React.useState(0);
    const [sources, setSources] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [transPage, setTransPage] = React.useState(0);

    // Routing Logic
    React.useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (['health', 'finance', 'settings'].includes(hash)) setActiveTab(hash);
            else window.location.hash = '#health';
        };
        if (!window.location.hash) window.location.hash = '#health';
        else handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    React.useEffect(() => {
        if (isLoggedIn) {
            fetchUserProfile();
            if (activeTab === 'health') fetchHealthRecords();
            if (activeTab === 'finance') { fetchSources(); fetchTransactions(); }
        }
    }, [isLoggedIn, activeTab, healthPage, transPage]);

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setUserProfile(await res.json());
            else handleLogout();
        } catch (err) { handleLogout(); }
    };

    const fetchHealthRecords = async () => {
        setIsFetchingHealth(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/health?skip=${healthPage * 5}&limit=5`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setHealthRecords(await res.json());
        } finally { setIsFetchingHealth(false); }
    };

    const handleHealthSave = async (form, editingId) => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const url = editingId ? `/api/health/${editingId}` : '/api/health';
        try {
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) { fetchHealthRecords(); return true; }
            return false;
        } finally { setIsSaving(false); }
    };

    const handleHealthDelete = async (id) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/health/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) fetchHealthRecords();
    };

    const fetchSources = async () => {
        setIsFetchingFinance(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/sources', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSources(await res.json());
        } finally { if (activeTab === 'finance' && transactions.length > 0) setIsFetchingFinance(false); }
    };

    const fetchTransactions = async () => {
        setIsFetchingFinance(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/transactions?skip=${transPage * 5}&limit=5`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setTransactions(await res.json());
        } finally { setIsFetchingFinance(false); }
    };

    const handleAddSource = async (form) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        if (res.ok) fetchSources();
    };

    const handleAddTransaction = async (form) => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) { fetchSources(); fetchTransactions(); }
        } finally { setIsSaving(false); }
    };

    const handleTransDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { fetchSources(); fetchTransactions(); }
        } catch (err) { console.error(err); }
    };

    const handleLogin = async (username, password) => {
        setIsLoading(true); setError('');
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        try {
            const res = await fetch('/token', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                setIsLoggedIn(true);
            } else { setError('Invalid login'); }
        } catch (err) { setError('Failed to connect'); }
        finally { setIsLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserProfile(null);
        window.location.hash = '#health';
    };

    if (!isLoggedIn) return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;

    return (
        <div className="min-h-screen pb-20">
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight">Monitor</span>
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-2">Hi, {userProfile?.username}</p>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-8 animate-in">
                {activeTab === 'health' && (
                    <HealthMonitor 
                        records={healthRecords} 
                        page={healthPage} 
                        onPageChange={setHealthPage}
                        onSave={handleHealthSave}
                        onDelete={handleHealthDelete}
                        isSaving={isSaving}
                        isFetching={isFetchingHealth}
                    />
                )}
                {activeTab === 'finance' && (
                    <FinanceTracker 
                        sources={sources}
                        transactions={transactions}
                        page={transPage}
                        onPageChange={setTransPage}
                        onAddSource={handleAddSource}
                        onAddTransaction={handleAddTransaction}
                        onDeleteTransaction={handleTransDelete}
                        isSaving={isSaving}
                        isFetching={isFetchingFinance}
                    />
                )}
                {activeTab === 'settings' && <SettingsView userProfile={userProfile} onLogout={handleLogout} />}
            </main>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-2xl shadow-2xl border border-white/50 p-2 flex justify-around items-center z-50">
                <button onClick={() => window.location.hash = '#health'} className={`p-3 rounded-xl transition ${activeTab === 'health' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
                <button onClick={() => window.location.hash = '#finance'} className={`p-3 rounded-xl transition ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                <button onClick={() => window.location.hash = '#settings'} className={`p-3 rounded-xl transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
