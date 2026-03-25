import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const STORAGE_KEYS = {
    role: 'role',
    name: 'userName',
    restrictions: 'restrictions'
};

const readStorage = () => {
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
        role,
        userName: name || 'User',
        restrictions
    };
};

const AuthContext = createContext({
    isAuthenticated: false,
    isAuthChecked: false,
    role: null,
    userName: 'User',
    restrictions: {},
    setAuthData: () => {},
    clearAuthData: () => {}
});

export const AuthProvider = ({ children }) => {
    const stored = readStorage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [role, setRole] = useState(stored.role);
    const [userName, setUserName] = useState(stored.userName);
    const [restrictions, setRestrictions] = useState(stored.restrictions);

    const syncToStorage = useCallback((next) => {
        const nextRole = next.role ?? null;
        const nextName = next.userName ?? 'User';
        const nextRestrictions = next.restrictions ?? {};

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

        setRole(nextRole);
        setUserName(nextName);
        setRestrictions(nextRestrictions);
    }, []);

    const setAuthData = useCallback(
        ({ role: newRole, userName: newName, restrictions: newRestrictions }) => {
            setIsAuthenticated(true);
            syncToStorage({
                role: newRole,
                userName: newName,
                restrictions: newRestrictions
            });
        },
        [syncToStorage]
    );

    const clearAuthData = useCallback(() => {
        setIsAuthenticated(false);
        syncToStorage({ role: null, userName: 'User', restrictions: {} });
    }, [syncToStorage]);

    useEffect(() => {
        let canceled = false;
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                if (canceled) return;
                const { role: serverRole, name: serverName, restrictions: serverRestrictions } = response.data || {};
                setIsAuthenticated(true);
                syncToStorage({
                    role: serverRole || role,
                    userName: serverName || userName,
                    restrictions: serverRestrictions || restrictions
                });
            } catch {
                if (!canceled) {
                    setIsAuthenticated(false);
                }
            } finally {
                if (!canceled) {
                    setIsAuthChecked(true);
                }
            }
        };
        fetchProfile();
        return () => {
            canceled = true;
        };
    }, [role, userName, restrictions, syncToStorage]);

    useEffect(() => {
        const handleStorage = () => {
            const storedState = readStorage();
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
            value={{ isAuthenticated, isAuthChecked, role, userName, restrictions, setAuthData, clearAuthData }}
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
