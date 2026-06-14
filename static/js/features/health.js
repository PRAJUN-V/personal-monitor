function HealthMonitor({ records, page, onPageChange, onSave, onEdit, onDelete, isSaving }) {
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState(null);
    const [form, setForm] = React.useState({
        date: new Date().toISOString().split('T')[0],
        height: '',
        weight: '',
        bp_systolic: '',
        bp_diastolic: ''
    });

    const getBMICategoryColor = (category) => {
        switch(category) {
            case 'Normal weight': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Underweight': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Overweight': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Obese': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const success = await onSave(form, editingId);
        if (success) {
            setShowForm(false);
            setEditingId(null);
            setForm({ date: new Date().toISOString().split('T')[0], height: '', weight: '', bp_systolic: '', bp_diastolic: '' });
        }
    };

    const startEdit = (record) => {
        setEditingId(record.id);
        setForm({
            date: record.date,
            height: record.height,
            weight: record.weight,
            bp_systolic: record.bp_systolic || '',
            bp_diastolic: record.bp_diastolic || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <React.Fragment>
            {/* Health Summary Card */}
            {records.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latest BMI</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">{records[0].bmi}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getBMICategoryColor(records[0].category)}`}>{records[0].category}</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Latest Weight</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-slate-900">{records[0].weight}</span>
                            <span className="text-slate-400 text-sm mb-1">kg</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Goal Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                            <span className="text-sm font-semibold text-emerald-600 italic">
                                {records[0].weight_diff_to_normal === 0 ? "Normal" : `${records[0].weight_diff_to_normal > 0 ? "Lose" : "Gain"} ${Math.abs(records[0].weight_diff_to_normal)}kg`}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900">Health History</h2>
                    <button onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition">
                        {showForm ? 'Close' : 'Add Entry'}
                    </button>
                </div>

                {showForm && (
                    <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 animate-in">
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label><input type="date" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ht (cm)</label><input type="number" step="0.1" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Wt (kg)</label><input type="number" step="0.1" required className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">BP Sys</label><input type="number" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={form.bp_systolic} onChange={e => setForm({...form, bp_systolic: e.target.value})} /></div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">BP Dia</label><input type="number" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm" value={form.bp_diastolic} onChange={e => setForm({...form, bp_diastolic: e.target.value})} /></div>
                            <div className="col-span-2 md:col-span-5 flex justify-end">
                                <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-8 py-2 rounded-xl text-sm font-bold disabled:bg-indigo-300">
                                    {isSaving ? 'Saving...' : (editingId ? 'Update Record' : 'Save Progress')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {records.map(r => (
                            <div key={r.id} className="p-5 bg-white space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-bold text-slate-900">{new Date(r.date).toLocaleDateString()}</span>
                                    <div className="flex gap-4">
                                        <button onClick={() => startEdit(r)} className="text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                        <button onClick={() => onDelete(r.id)} className="text-slate-400 hover:text-rose-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 text-xs">
                                    <div><p className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Ht</p><p className="font-bold text-slate-900">{r.height}cm</p></div>
                                    <div><p className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Wt</p><p className="font-bold text-slate-900">{r.weight}kg</p></div>
                                    <div><p className="text-slate-400 font-bold uppercase tracking-tighter mb-1">BMI</p><p className="font-bold text-indigo-600">{r.bmi}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <table className="hidden md:table w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr><th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th><th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Height</th><th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</th><th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">BP</th><th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI Status</th><th className="p-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-4">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="p-4">{r.height}cm</td><td className="p-4 font-bold">{r.weight}kg</td>
                                    <td className="p-4">{r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic}` : '—'}</td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] border font-bold uppercase ${getBMICategoryColor(r.category)}`}>{r.category} ({r.bmi})</span></td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => startEdit(r)} className="text-slate-300 hover:text-indigo-600 mr-4 font-bold uppercase text-[10px]">Edit</button>
                                        <button onClick={() => onDelete(r.id)} className="text-slate-300 hover:text-rose-600 font-bold uppercase text-[10px]">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t flex justify-between text-xs bg-slate-50">
                    <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="px-4 py-2 border rounded-xl bg-white font-bold uppercase text-[10px] disabled:opacity-30">Prev</button>
                    <button disabled={records.length < 5} onClick={() => onPageChange(page + 1)} className="px-4 py-2 border rounded-xl bg-white font-bold uppercase text-[10px] disabled:opacity-30">Next</button>
                </div>
            </div>
        </React.Fragment>
    );
}

window.HealthMonitor = HealthMonitor;
