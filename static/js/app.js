function App() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!localStorage.getItem('token'));
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [userProfile, setUserProfile] = React.useState(null);

    // Navigation State
    const [activeTab, setActiveTab] = React.useState('health');

    // Health State
    const [healthRecords, setHealthRecords] = React.useState([]);
    const [healthPage, setHealthPage] = React.useState(0);
    const [showHealthForm, setShowHealthForm] = React.useState(false);
    const [editingRecordId, setEditingRecordId] = React.useState(null);
    const [healthForm, setHealthForm] = React.useState({
        date: new Date().toISOString().split('T')[0],
        height: '',
        weight: '',
        bp_systolic: '',
        bp_diastolic: ''
    });

    // Finance State
    const [sources, setSources] = React.useState([]);
    const [transactions, setTransactions] = React.useState([]);
    const [transPage, setTransPage] = React.useState(0);
    const [showSourceForm, setShowSourceForm] = React.useState(false);
    const [showTransForm, setShowTransForm] = React.useState(false);
    const [sourceForm, setSourceForm] = React.useState({ name: '', balance: '' });
    const [transForm, setTransForm] = React.useState({
        source_id: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    React.useEffect(() => {
        if (isLoggedIn) {
            fetchUserProfile();
            if (activeTab === 'health') fetchHealthRecords();
            if (activeTab === 'finance') {
                fetchSources();
                fetchTransactions();
            }
        }
    }, [isLoggedIn, activeTab, healthPage, transPage]);

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

    // Health Functions
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

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const sanitizedData = {
            ...healthForm,
            bp_systolic: healthForm.bp_systolic === "" ? null : parseInt(healthForm.bp_systolic),
            bp_diastolic: healthForm.bp_diastolic === "" ? null : parseInt(healthForm.bp_diastolic),
            height: parseFloat(healthForm.height),
            weight: parseFloat(healthForm.weight)
        };
        const url = editingRecordId ? `/api/health/${editingRecordId}` : '/api/health';
        const method = editingRecordId ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(sanitizedData)
            });
            if (response.ok) {
                fetchHealthRecords();
                setShowHealthForm(false);
                setEditingRecordId(null);
                setHealthForm({ date: new Date().toISOString().split('T')[0], height: '', weight: '', bp_systolic: '', bp_diastolic: '' });
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

    const handleEdit = (record) => {
        setEditingRecordId(record.id);
        setHealthForm({ date: record.date, height: record.height, weight: record.weight, bp_systolic: record.bp_systolic || '', bp_diastolic: record.bp_diastolic || '' });
        setShowHealthForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (recordId) => {
        if (!window.confirm("Delete record?")) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/health/${recordId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) fetchHealthRecords();
        } catch (err) { console.error("Delete failed", err); }
    };

    // Finance Functions
    const fetchSources = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/sources', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setSources(await res.json());
        } catch (err) { console.error("Source fetch failed", err); }
    };

    const fetchTransactions = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/transactions?skip=${transPage * 5}&limit=5`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setTransactions(await res.json());
        } catch (err) { console.error("Transaction fetch failed", err); }
    };

    const handleSourceSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...sourceForm, balance: parseFloat(sourceForm.balance) })
            });
            if (res.ok) {
                fetchSources();
                setShowSourceForm(false);
                setSourceForm({ name: '', balance: '' });
            }
        } catch (err) { console.error("Source save failed", err); }
    };

    const handleTransSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...transForm, amount: parseFloat(transForm.amount), source_id: parseInt(transForm.source_id) })
            });
            if (res.ok) {
                fetchSources();
                fetchTransactions();
                setShowTransForm(false);
                setTransForm({ source_id: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], description: '' });
            }
        } catch (err) { console.error("Transaction save failed", err); }
        finally { setIsSaving(false); }
    };

    const handleTransDelete = async (id) => {
        if (!window.confirm("Delete transaction? This will reverse the balance update.")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { fetchSources(); fetchTransactions(); }
        } catch (err) { console.error("Delete failed", err); }
    };

    // Auth Functions
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        try {
            const response = await fetch('/token', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                setIsLoggedIn(true);
            } else { setError(data.detail || 'Invalid credentials'); }
        } catch (err) { setError('Unable to connect to server'); }
        finally { setIsLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserProfile(null);
        setHealthRecords([]);
        setSources([]);
        setTransactions([]);
        setActiveTab('health');
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
                            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <span className="font-bold text-slate-900 tracking-tight">Monitor</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-slate-500">Welcome</p>
                                <p className="text-sm font-semibold text-slate-900">{userProfile?.username}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                        </div>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-4 py-8 animate-in">
                    {activeTab === 'health' && (
                        <React.Fragment>
                            {/* Health Summary & History (Previous logic) */}
                            {healthRecords.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latest BMI</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold text-slate-900">{healthRecords[0].bmi}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getBMICategoryColor(healthRecords[0].category)}`}>{healthRecords[0].category}</span>
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
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Goal Status</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                                            <span className="text-sm font-semibold text-emerald-600 italic">{healthRecords[0].weight_diff_to_normal === 0 ? "Normal" : `${healthRecords[0].weight_diff_to_normal > 0 ? "Lose" : "Gain"} ${Math.abs(healthRecords[0].weight_diff_to_normal)}kg`}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-xl font-bold text-slate-900">Health History</h2>
                                    <button onClick={() => { setShowHealthForm(!showHealthForm); if (showHealthForm) setEditingRecordId(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition">{showHealthForm ? 'Close' : 'Add Entry'}</button>
                                </div>

                                {showHealthForm && (
                                    <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 animate-in">
                                        <form onSubmit={handleHealthSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label><input type="date" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={healthForm.date} onChange={e => setHealthForm({...healthForm, date: e.target.value})} /></div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ht (cm)</label><input type="number" step="0.1" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={healthForm.height} onChange={e => setHealthForm({...healthForm, height: e.target.value})} /></div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Wt (kg)</label><input type="number" step="0.1" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={healthForm.weight} onChange={e => setHealthForm({...healthForm, weight: e.target.value})} /></div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">BP Sys</label><input type="number" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={healthForm.bp_systolic} onChange={e => setHealthForm({...healthForm, bp_systolic: e.target.value})} /></div>
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">BP Dia</label><input type="number" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={healthForm.bp_diastolic} onChange={e => setHealthForm({...healthForm, bp_diastolic: e.target.value})} /></div>
                                            <div className="col-span-2 md:col-span-5 flex justify-end">
                                                <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-8 py-2 rounded-xl text-sm font-bold disabled:bg-indigo-300">
                                                    {isSaving ? 'Saving...' : (editingRecordId ? 'Update Record' : 'Save Progress')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {healthRecords.map(r => (
                                            <div key={r.id} className="p-5 bg-white space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-bold text-slate-900">{new Date(r.date).toLocaleDateString()}</span>
                                                    <div className="flex gap-4">
                                                        <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                        <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 text-xs">
                                                    <div><p className="text-slate-400">Ht</p><p className="font-bold">{r.height}cm</p></div>
                                                    <div><p className="text-slate-400">Wt</p><p className="font-bold">{r.weight}kg</p></div>
                                                    <div><p className="text-slate-400">BMI</p><p className="font-bold text-indigo-600">{r.bmi}</p></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <table className="hidden md:table w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr><th className="p-4">Date</th><th className="p-4">Height</th><th className="p-4">Weight</th><th className="p-4">BP</th><th className="p-4">BMI Status</th><th className="p-4 text-right">Actions</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {healthRecords.map(r => (
                                                <tr key={r.id} className="hover:bg-slate-50">
                                                    <td className="p-4">{new Date(r.date).toLocaleDateString()}</td>
                                                    <td className="p-4">{r.height}cm</td><td className="p-4 font-bold">{r.weight}kg</td>
                                                    <td className="p-4">{r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic}` : '—'}</td>
                                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] border ${getBMICategoryColor(r.category)}`}>{r.category} ({r.bmi})</span></td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleEdit(r)} className="text-slate-300 hover:text-indigo-600 mr-4">Edit</button>
                                                        <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-rose-600">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t flex justify-between text-xs bg-slate-50">
                                    <button disabled={healthPage === 0} onClick={() => setHealthPage(healthPage - 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-30">Prev</button>
                                    <button disabled={healthRecords.length < 5} onClick={() => setHealthPage(healthPage + 1)} className="px-3 py-1 border rounded bg-white disabled:opacity-30">Next</button>
                                </div>
                            </div>
                        </React.Fragment>
                    )}

                    {activeTab === 'finance' && (
                        <div className="animate-in space-y-8">
                            {/* Sources Overview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {sources.map(s => (
                                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-indigo-500">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.name}</p>
                                        <p className="text-xl font-black text-slate-900">₹{s.balance.toLocaleString()}</p>
                                    </div>
                                ))}
                                <button onClick={() => setShowSourceForm(true)} className="border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition flex flex-col items-center justify-center">
                                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-[10px] font-bold uppercase">Add Source</span>
                                </button>
                            </div>

                            {/* Forms Modal-ish */}
                            {(showSourceForm || showTransForm) && (
                                <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-2xl animate-in">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold">{showSourceForm ? 'New Money Source' : 'New Transaction'}</h2>
                                        <button onClick={() => { setShowSourceForm(false); setShowTransForm(false); }} className="text-indigo-300 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </div>

                                    {showSourceForm ? (
                                        <form onSubmit={handleSourceSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-xs font-bold text-indigo-300 block mb-1">Name</label><input type="text" required placeholder="SBI, Cash, ICICI..." className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white placeholder-indigo-500" value={sourceForm.name} onChange={e => setSourceForm({...sourceForm, name: e.target.value})} /></div>
                                                <div><label className="text-xs font-bold text-indigo-300 block mb-1">Initial Balance</label><input type="number" required placeholder="0.00" className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white placeholder-indigo-500" value={sourceForm.balance} onChange={e => setSourceForm({...sourceForm, balance: e.target.value})} /></div>
                                            </div>
                                            <button type="submit" className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 transition">Create Source</button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleTransSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-indigo-300 block mb-1">Source</label><select required className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white" value={transForm.source_id} onChange={e => setTransForm({...transForm, source_id: e.target.value})}><option value="">Select Account</option>{sources.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.balance})</option>)}</select></div>
                                                <div><label className="text-xs font-bold text-indigo-300 block mb-1">Type</label><select className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white" value={transForm.type} onChange={e => setTransForm({...transForm, type: e.target.value})}><option value="expense">Expense (-)</option><option value="income">Income (+)</option></select></div>
                                                <div><label className="text-xs font-bold text-indigo-300 block mb-1">Amount</label><input type="number" step="0.01" required placeholder="0.00" className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white placeholder-indigo-500" value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} /></div>
                                                <div className="col-span-2"><label className="text-xs font-bold text-indigo-300 block mb-1">Category / Purpose</label><input type="text" required placeholder="Lunch, Salary, Fuel..." className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white placeholder-indigo-500" value={transForm.category} onChange={e => setTransForm({...transForm, category: e.target.value})} /></div>
                                                <div><label className="text-xs font-bold text-indigo-300 block mb-1">Date</label><input type="date" required className="w-full bg-indigo-800 border-none rounded-xl p-3 text-white" value={transForm.date} onChange={e => setTransForm({...transForm, date: e.target.value})} /></div>
                                            </div>
                                            <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 disabled:bg-emerald-800">{isSaving ? 'Processing...' : 'Complete Transaction'}</button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Transaction List */}
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                                    <button onClick={() => setShowTransForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 transition flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>New Payment</button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {transactions.map(t => (
                                        <div key={t.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition group">
                                            <div className="flex gap-4 items-center">
                                                <div className={`p-3 rounded-2xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {t.type === 'income' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5-5v12" /></svg>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{t.category}</p>
                                                    <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        <span>{t.source_name}</span>
                                                        <span>•</span>
                                                        <span>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>{t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}</p>
                                                <button onClick={() => handleTransDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <div className="p-20 text-center text-slate-400"><p className="text-sm font-medium italic">No transactions yet. Start by adding a payment!</p></div>}
                                </div>
                                <div className="p-4 bg-slate-50 flex justify-between border-t border-slate-100">
                                    <button disabled={transPage === 0} onClick={() => setTransPage(transPage - 1)} className="px-4 py-1 text-[10px] font-bold uppercase border rounded-xl bg-white disabled:opacity-30">Back</button>
                                    <button disabled={transactions.length < 5} onClick={() => setTransPage(transPage + 1)} className="px-4 py-1 text-[10px] font-bold uppercase border rounded-xl bg-white disabled:opacity-30">More</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
                            <div className="bg-slate-200 p-8 rounded-full mb-6 text-slate-600 shadow-inner"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Settings</h2>
                            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">Personalized configuration, theme options, and profile management are on their way.</p>
                            <div className="mt-8"><button onClick={() => setActiveTab('health')} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Back to Monitor</button></div>
                        </div>
                    )}
                </main>

                {/* Mobile Navigation Bar */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-2xl shadow-2xl border border-white/50 p-2 flex justify-around items-center z-50">
                    <button onClick={() => setActiveTab('health')} className={`p-3 rounded-xl transition ${activeTab === 'health' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
                    <button onClick={() => setActiveTab('finance')} className={`p-3 rounded-xl transition ${activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                    <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-xl transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm text-center">
                <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100 mb-6 inline-block"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Welcome</h1>
                <p className="text-slate-500 font-medium mb-8">Log in to your monitor</p>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-left">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Username</label><input type="text" required placeholder="Enter username" className="w-full bg-slate-50 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label><input type="password" required placeholder="••••••••" className="w-full bg-slate-50 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                        {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:bg-indigo-300">{isLoading ? 'Signing In...' : 'Sign In'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
