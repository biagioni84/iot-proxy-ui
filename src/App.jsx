import { createContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './sign-in/SignIn'
import Dashboard from './dashboard/Dashboard';


export const LoginContext = createContext();

function App() {

    const [loggedIn, setLoggedIn] = useState(
        !!localStorage.getItem('access')
    );
    function changeLoggedIn(value) {
        setLoggedIn(value);
        if (value === false) {
          localStorage.removeItem('access');
        }
    }

    return (
        <LoginContext.Provider value={[loggedIn, changeLoggedIn]}>
            <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/login" element={<SignIn />} />
                    </Routes>
            </BrowserRouter>
        </LoginContext.Provider>
    );
}

export default App;
