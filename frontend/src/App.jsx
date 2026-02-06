import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Companies from './Companies';
import Branches from './Branches';
import Products from './Products';
import Invoices from './Invoices';
import Accounting from './Accounting';
import FixedAssets from './FixedAssets';
import JournalEntries from './JournalEntries';
import Inventory from './Inventory';
import InventoryOperations from './InventoryOperations';
import Contacts from './Contacts';
import Employees from './Employees';
import Representatives from './Representatives';
import Drivers from './Drivers';
import Finances from './Finances';
import Reports from './Reports';
import Settings from './Settings';
import UsersPermissions from './UsersPermissions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/companies" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Companies />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/branches" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Branches />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/products" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Products />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/invoices" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Invoices />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/invoices/:type" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Invoices />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/accounting" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Accounting />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/accounting/:sub" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Accounting />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/fixed-assets" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <FixedAssets />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/journal-entries" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <JournalEntries />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/contacts" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Contacts />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/employees" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Employees />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/employees/:sub" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Employees />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/representatives" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Representatives />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/drivers" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Drivers />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/finances" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Finances />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/inventory" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Inventory />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/inventory-operations" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <InventoryOperations />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/inventory-operations/:type" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <InventoryOperations />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Reports />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/users-permissions" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <UsersPermissions />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
