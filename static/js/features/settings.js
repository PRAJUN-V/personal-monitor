function Settings({ userProfile, onLogout }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
            <div className="bg-slate-200 p-8 rounded-full mb-6 text-slate-600 shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Settings</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
                Manage your account and app preferences here.
            </p>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-sm w-full">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">Your Profile</p>
                <div className="flex items-center gap-4 mb-6 text-left">
                    <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                        {userProfile?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{userProfile?.username}</p>
                        <p className="text-xs text-slate-500 italic">Personal Monitor Member</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="w-full bg-rose-50 text-rose-600 font-bold py-3 rounded-2xl hover:bg-rose-100 transition flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                </button>
            </div>
        </div>
    );
}

window.SettingsView = Settings;
