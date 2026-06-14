function Login({ onLogin, isLoading, error }) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm text-center">
                <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100 mb-6 inline-block">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Welcome</h1>
                <p className="text-slate-500 font-medium mb-8">Log in to your monitor</p>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-left">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Username</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Enter username" 
                                className="w-full bg-slate-50 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="••••••••" 
                                className="w-full bg-slate-50 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </div>
                        {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg disabled:bg-indigo-300"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

window.Login = Login;
