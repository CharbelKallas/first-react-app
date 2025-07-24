import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Onboarding from '../features/onboarding/onboarding';
import Landing from '../features/landing/landing';

const AppRouter = () => {
    const [username, setUsername] = useState('');

    return (
        <Routes>
            <Route path="/welcome" element={<Onboarding setUsername={setUsername} />} />
            <Route path="/logged-in" element={<Landing username={username} />} />
        </Routes>
    );
};

export default AppRouter;
