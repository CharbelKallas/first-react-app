import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProps } from './onboarding.d';

const Onboarding: React.FC<OnboardingProps> = ({ setUsername }) => {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        setUsername(name);
        navigate('/logged-in');
    };

    return (
        <div style={{ padding: '20px' }}>
            <input
                type="text"
                placeholder="Enter your username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginRight: '10px' }}
            />
            <button onClick={handleLogin}>Log In</button>
        </div>
    );
};

export default Onboarding;
