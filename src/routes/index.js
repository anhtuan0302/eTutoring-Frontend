import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Login from '../pages/login';

function IndexRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
        </Routes>
    );
}

export default IndexRoutes;