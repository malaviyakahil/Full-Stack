import React, { createContext, useContext, useEffect, useState } from "react";
import { authMe } from "../apis/user.apis";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await authMe();
        setUser({ authenticated: true });
      } catch (error) {
        setUser(null);
      }finally{
        setLoading(false)
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
