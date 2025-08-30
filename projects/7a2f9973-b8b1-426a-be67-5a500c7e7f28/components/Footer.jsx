import React from 'react';
import '../styles/Footer.css';

function Footer() {
    return (
        <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} Car Selling Website. All rights reserved.</p>
        </footer>
    );
}

export default Footer;