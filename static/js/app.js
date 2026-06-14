function App() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [userProfile, setUserProfile] = React.useState(null);

    // Health State
    const [healthRecords, setHealthRecords] = React.useState([]);
    const [healthPage, setHealthPage] = React.useState(0);
    const [showHealthForm, setShowHealthForm] = React.useState(false);
    const [healthForm, setHealthForm] = React.useState({
        date: new Date().toISOString().split('T')[0],
        height: '',
        weight: '',
        bp_systolic: '',
        bp_diastolic: ''
    });

    React.useEffect(() => {
        if (isLoggedIn) {
            fetchUserProfile();
            fetchHealthRecords();
        }
    }, [isLoggedIn, healthPage]);

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUserProfile(data);
            } else {
                handleLogout();
            }
        } catch (err) {
            handleLogout();
        }
    };

    const fetchHealthRecords = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/health?skip=${healthPage * 5}&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHealthRecords(data);
            }
        } catch (err) {
            console.error("Failed to fetch records", err);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch('/token', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                setIsLoggedIn(true);
            } else {
                setError(data.detail || 'Invalid credentials');
            }
        } catch (err) {
            setError('Unable to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('token');
        
        // Sanitize data: Convert empty strings to null for optional BP fields
        const sanitizedData = {
            ...healthForm,
            bp_systolic: healthForm.bp_systolic === "" ? null : parseInt(healthForm.bp_systolic),
            bp_diastolic: healthForm.bp_diastolic === "" ? null : parseInt(healthForm.bp_diastolic),
            height: parseFloat(healthForm.height),
            weight: parseFloat(healthForm.weight)
        };

        try {
            const response = await fetch('/api/health', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sanitizedData)
            });
            if (response.ok) {
                fetchHealthRecords();
                setShowHealthForm(false);
                setHealthForm({
                    ...healthForm,
                    weight: '',
                    bp_systolic: '',
                    bp_diastolic: ''
                });
            } else {
                const errData = await response.json();
                alert("Failed to save: " + (errData.detail?.[0]?.msg || "Invalid input"));
            }
        } catch (err) {
            console.error("Failed to save record", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserProfile(null);
        setHealthRecords([]);
    };

    const getBMICategoryColor = (category) => {
        switch(category) {
            case 'Normal weight': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Underweight': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Overweight': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Obese': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (isLoggedIn) {
        return (
            <div className="min-h-screen pb-20">
                {/* Modern Navbar */}
                <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">Monitor</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-slate-500">Welcome</p>
                                <p className="text-sm font-semibold text-slate-900">{userProfile?.username}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-4 py-8 animate-in">
                    {/* Stats Summary Card */}
                    {healthRecords.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latest BMI</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-slate-900">{healthRecords[0].bmi}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getBMICategoryColor(healthRecords[0].category)}`}>
                                        {healthRecords[0].category}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latest Weight</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-slate-900">{healthRecords[0].weight}</span>
                                    <span className="text-slate-400 text-sm mb-1">kg</span>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-sm font-semibold text-emerald-600 italic">
                                        {healthRecords[0].weight_diff_to_normal === 0 
                                            ? "Perfectly Normal" 
                                            : `${healthRecords[0].weight_diff_to_normal > 0 ? "Lose" : "Gain"} ${Math.abs(healthRecords[0].weight_diff_to_normal)}kg to reach goal`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Health History</h2>
                                <p className="text-sm text-slate-500">Track your progress over time</p>
                            </div>
                            <button 
                                onClick={() => setShowHealthForm(!showHealthForm)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition flex items-center gap-2"
                            >
                                {showHealthForm ? 'Close' : (
                                    <React.Fragment>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                        Add Entry
                                    </React.Fragment>
                                )}
                            </button>
                        </div>

                        {showHealthForm && (
                            <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 animate-in">
                                <form onSubmit={handleHealthSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                                        <input type="date" required className="w-full bg-white px-3 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" 
                                            value={healthForm.date} onChange={e => setHealthForm({...healthForm, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Height (cm)</label>
                                        <input type="number" step="0.1" required placeholder="175" className="w-full bg-white px-3 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" 
                                            value={healthForm.height} onChange={e => setHealthForm({...healthForm, height: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weight (kg)</label>
                                        <input type="number" step="0.1" required placeholder="70" className="w-full bg-white px-3 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" 
                                            value={healthForm.weight} onChange={e => setHealthForm({...healthForm, weight: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">BP Sys</label>
                                        <input type="number" placeholder="Optional" className="w-full bg-white px-3 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" 
                                            value={healthForm.bp_systolic} onChange={e => setHealthForm({...healthForm, bp_systolic: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">BP Dia</label>
                                        <input type="number" placeholder="Optional" className="w-full bg-white px-3 py-2 rounded-xl border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500" 
                                            value={healthForm.bp_diastolic} onChange={e => setHealthForm({...healthForm, bp_diastolic: e.target.value})} />
                                    </div>
                                    <div className="col-span-2 md:col-span-5 flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={isSaving}
                                            className={`px-8 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                                                isSaving 
                                                ? 'bg-indigo-300 cursor-not-allowed text-white' 
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                        >
                                            {isSaving ? (
                                                <React.Fragment>
                                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </React.Fragment>
                                            ) : 'Save Progress'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Height</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blood Pressure</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {healthRecords.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/80 transition group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-600">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-bold text-slate-900">{r.height}</span>
                                                    <span className="text-[10px] text-slate-400">cm</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-bold text-slate-900">{r.weight}</span>
                                                    <span className="text-[10px] text-slate-400">kg</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.bp_systolic ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {r.bp_systolic}/{r.bp_diastolic}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono font-bold text-slate-700">{r.bmi}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getBMICategoryColor(r.category)}`}>
                                                        {r.category}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Modern Pagination */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-400">Showing page {healthPage + 1}</span>
                            <div className="flex gap-2">
                                <button 
                                    disabled={healthPage === 0}
                                    onClick={() => setHealthPage(healthPage - 1)}
                                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 transition"
                                >
                                    Previous
                                </button>
                                <button 
                                    disabled={healthRecords.length < 5}
                                    onClick={() => setHealthPage(healthPage + 1)}
                                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-30 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Mobile Navigation Bar */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-2xl shadow-2xl border border-white/50 p-2 flex justify-around items-center z-50">
                    <button className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    <button className="p-3 text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button className="p-3 text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo/Icon */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Welcome</h1>
                    <p className="text-slate-500 font-medium">Log in to your monitor</p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Username</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Enter your username"
                                className="w-full bg-slate-50 px-4 py-3.5 rounded-2xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900 placeholder-slate-300"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                className="w-full bg-slate-50 px-4 py-3.5 rounded-2xl border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900 placeholder-slate-300"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && (
                            <div className="bg-rose-50 text-rose-500 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {error}
                            </div>
                        )}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
