import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');

// --- API Helper ---
const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
        // Automatically logout user if token is invalid
        localStorage.removeItem('token');
        window.location.href = '/login'; 
    }
    return response;
};

// --- Auth Components ---
const AuthPage = ({ isLogin, onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const endpoint = isLogin ? 'login' : 'register';
    const buttonText = isLogin ? 'Login' : 'Register';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_URL}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'An error occurred.');
            
            if (isLogin) {
                localStorage.setItem('token', data.token);
                onAuthSuccess();
                navigate('/');
            } else {
                navigate('/login'); // Redirect to login after successful registration
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-black font-mono flex flex-col items-center justify-start pt-40 p-4">
            <h1 className="font-[anton] text-8xl md:text-8xl font-bold text-white tracking-wider">CLIpp</h1>
            <div className="mt-8 w-full max-w-md">
                <div className="bg-black border border-gray-700 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            className="w-full p-3 bg-zinc-900 border border-gray-600 text-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="w-full p-3 bg-zinc-900 border border-gray-600 text-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        />
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full py-3 bg-green-500 text-gray-900 font-bold rounded-md hover:bg-green-400">
                            {buttonText}
                        </button>
                    </form>
                    <p className="mt-4 text-center text-gray-400">
                        {isLogin ? "Need an account? " : "Already have an account? "}
                        <Link to={isLogin ? '/register' : '/login'} className="text-green-400 hover:text-green-300">
                            {isLogin ? 'Register' : 'Login'}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Dashboard Component ---
const DashboardPage = ({ onLogout }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            const response = await authFetch(`${API_URL}/api/notes`);
            const data = await response.json();
            if (response.ok) setNotes(data);
        };
        fetchNotes();
    }, []);

    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        const response = await authFetch(`${API_URL}/api/notes`, {
            method: 'POST',
            body: JSON.stringify({ content: newNote }),
        });
        const data = await response.json();
        if (response.ok) {
            setNotes([data, ...notes]);
            setNewNote('');
        }
    };

    const handleDeleteNote = async (id) => {
        const response = await authFetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            setNotes(notes.filter(note => note.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-black font-mono">
            <nav className="bg-black border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex-shrink-0 flex items-center text-2xl font-bold text-white font-[anton] tracking-wider">CLIpp</div>
                        <button onClick={onLogout} className="self-center px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <form onSubmit={handleCreateNote} className="flex items-center space-x-4 bg-black p-4 rounded-lg shadow-lg mb-6 border border-gray-700">
                    <span className="text-green-400 font-bold text-lg">&gt;</span>
                    <input 
                        type="text"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Type your thoughts here..."
                        className="flex-grow bg-transparent border-none text-gray-300 focus:ring-0 p-2"
                    />
                    <button type="submit" className="px-4 py-2 bg-green-500 text-gray-900 font-bold rounded-md hover:bg-green-400 transition-colors">
                        Enter
                    </button>
                </form>
                <div className="space-y-4">
                    {notes.map(note => (
                        <div key={note.id} className="bg-black p-4 rounded-lg shadow flex justify-between items-start border border-gray-700">
                            <div>
                                <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                <p className="text-xs text-gray-500 mt-2">{new Date(note.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 ml-4 flex-shrink-0 hover:text-red-400 transition-colors">
                                [delete]
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

// --- Main App Router ---
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
    const navigate = useNavigate();

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
    };
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={<AuthPage isLogin={true} onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/register" element={<AuthPage isLogin={false} onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/dashboard" element={isAuthenticated ? <DashboardPage onLogout={handleLogout} /> : <Navigate to="/login" />} />
        </Routes>
    );
}

export default function AppWrapper() {
    return (
        <Router>
            <App />
        </Router>
    );
}
