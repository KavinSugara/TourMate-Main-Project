import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const userRole = localStorage.getItem('userRole');
    const isAuthenticated = localStorage.getItem('userId');

    if (!isAuthenticated || userRole !== 'Admin') {
        // If not logged in or not an admin, kick them back to login
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;