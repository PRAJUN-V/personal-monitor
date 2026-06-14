function FinanceTracker({ sources, transactions, page, onPageChange, onAddSource, onAddTransaction, onDeleteTransaction, isSaving }) {
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

    const handleSourceSubmit = (e) => {
        e.preventDefault();
        onAddSource(sourceForm);
        setShowSourceForm(false);
        setSourceForm({ name: '', balance: '' });
    };

    const handleTransSubmit = (e) => {
        e.preventDefault();
        onAddTransaction(transForm);
        setShowTransForm(false);
        setTransForm({ source_id: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], description: '' });
    };

    return (
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

            {/* Forms Modal */}
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
                                <button onClick={() => onDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <div className="p-20 text-center text-slate-400"><p className="text-sm font-medium italic">No transactions yet. Start by adding a payment!</p></div>}
                </div>
                <div className="p-4 bg-slate-50 flex justify-between border-t border-slate-100">
                    <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="px-4 py-1 text-[10px] font-bold uppercase border rounded-xl bg-white disabled:opacity-30">Back</button>
                    <button disabled={transactions.length < 5} onClick={() => onPageChange(page + 1)} className="px-4 py-1 text-[10px] font-bold uppercase border rounded-xl bg-white disabled:opacity-30">More</button>
                </div>
            </div>
        </div>
    );
}

window.FinanceTracker = FinanceTracker;
