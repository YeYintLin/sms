import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const STORAGE_KEYS = {
    token: 'token',
    role: 'role',
    name: 'userName',
    restrictions: 'restrictions'
};

const readStorage = () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const role = localStorage.getItem(STORAGE_KEYS.role);
    const name = localStorage.getItem(STORAGE_KEYS.name);
    let restrictions = {};
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.restrictions);
        restrictions = raw ? JSON.parse(raw) : {};
    } catch {
        restrictions = {};
    }
    return {
        token,
        role,
        userName: name || 'User',
        restrictions
    };
};

const AuthContext = createContext({
    token: null,
    role: null,
    userName: 'User',
    restrictions: {},
    setAuthData: () => {},
    clearAuthData: () => {}
});

export const AuthProvider = ({ children }) => {
    const stored = readStorage();
    const [token, setToken] = useState(stored.token);
    const [role, setRole] = useState(stored.role);
    const [userName, setUserName] = useState(stored.userName);
    const [restrictions, setRestrictions] = useState(stored.restrictions);

    const syncToStorage = useCallback((next) => {
        const nextToken = next.token ?? null;
        const nextRole = next.role ?? null;
        const nextName = next.userName ?? 'User';
        const nextRestrictions = next.restrictions ?? {};

        if (nextToken) {
            localStorage.setItem(STORAGE_KEYS.token, nextToken);
        } else {
            localStorage.removeItem(STORAGE_KEYS.token);
        }

        if (nextRole) {
            localStorage.setItem(STORAGE_KEYS.role, nextRole);
        } else {
            localStorage.removeItem(STORAGE_KEYS.role);
        }

        if (nextName) {
            localStorage.setItem(STORAGE_KEYS.name, nextName);
        } else {
            localStorage.removeItem(STORAGE_KEYS.name);
        }

        if (nextRestrictions && Object.keys(nextRestrictions).length > 0) {
            localStorage.setItem(STORAGE_KEYS.restrictions, JSON.stringify(nextRestrictions));
        } else {
            localStorage.removeItem(STORAGE_KEYS.restrictions);
        }

        setToken(nextToken);
        setRole(nextRole);
        setUserName(nextName);
        setRestrictions(nextRestrictions);
    }, []);

    const setAuthData = useCallback(
        ({ token: newToken, role: newRole, userName: newName, restrictions: newRestrictions }) => {
            syncToStorage({
                token: newToken,
                role: newRole,
                userName: newName,
                restrictions: newRestrictions
            });
        },
        [syncToStorage]
    );

    const clearAuthData = useCallback(() => {
        syncToStorage({ token: null, role: null, userName: 'User', restrictions: {} });
    }, [syncToStorage]);

    useEffect(() => {
        if (!token) return undefined;
        let canceled = false;
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                if (canceled) return;
                const { role: serverRole, name: serverName, restrictions: serverRestrictions } = response.data || {};
                syncToStorage({
                    token,
                    role: serverRole || role,
                    userName: serverName || userName,
                    restrictions: serverRestrictions || restrictions
                });
            } catch {
                // ignore
            }
        };
        fetchProfile();
        return () => {
            canceled = true;
        };
    }, [token, role, userName, restrictions, syncToStorage]);

    useEffect(() => {
        const handleStorage = () => {
            const storedState = readStorage();
            setToken(storedState.token);
            setRole(storedState.role);
            setUserName(storedState.userName);
            setRestrictions(storedState.restrictions);
        };
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{ token, role, userName, restrictions, setAuthData, clearAuthData }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
