import React from 'react';
import { LandingProps } from './landing.d';

const Landing: React.FC<LandingProps> = ({ username }) => {
    return (
        <div style={{ backgroundColor: 'cyan', height: '100vh' }}>
            <div style={{ backgroundColor: 'black', height: '60px' }}></div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'calc(100vh - 60px)',
                }}
            >
                <h1 style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '3rem', margin: '8px' }}>
                    Hello {username}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'red', fontWeight: '300', margin: '8px' }}>
                    Welcome to my website!
                </p>
            </div>
        </div>
    );
};

export default Landing;
