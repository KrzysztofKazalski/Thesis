import {createContext, useState, useEffect, ReactNode} from "react";
import User from "../Models/User.tsx";

/** Authentication context
 * This class is used for the authentication context so that the user can stay logged in across multiple pages.
 * The app utilizes session storage, more secure than local storage, but only persists while
 * the web browser tab is open.
 * @class AuthContext
 */

interface AuthContextType {
    user: User | null;
    loading:  boolean;
    login: (userData: User) => void;
    logout: () => void;
}

/**
 * Default context for AuthContextType.
 * AuthContextType demands a default param, hence this is created.
 * @const defaultAuthContext
 */
export const defaultAuthContext: AuthContextType = {
    user: null,
    loading: true,
    login: () => {},
    logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

/**
 * Stores the user object in the session storage.
 * @const AuthProvider
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const storedUser = sessionStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Failed to load user:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser().catch((error) => console.error("Error in fetchUser:", error));
    }, []);

    /**
     * Stores the user in session storage
     * @const login
     */
    const login = (userData: User) => {
        sessionStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    /**
     * Clears the user from the sesssion storage
     * @const logout
     */
    const logout = () => {
        sessionStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};