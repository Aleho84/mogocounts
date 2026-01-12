import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import CreateGroup from './pages/CreateGroup';
import ExpensesList from './pages/ExpensesList';
import BalanceView from './pages/BalanceView';
import AddExpense from './pages/AddExpense';
import GroupSettings from './pages/GroupSettings';
import BottomNav from './components/BottomNav';
import { useStore } from './store/useStore';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<CreateGroup />} />
        <Route path="/group/:id/expenses" element={<ExpensesList />} />
        <Route path="/group/:id/balance" element={<BalanceView />} />
        <Route path="/group/:id/add" element={<AddExpense />} />
        <Route path="/group/:id/settings" element={<GroupSettings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { currentGroup } = useStore();

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-github-bg pb-20"> {/* pb-20 for BottomNav space */}
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
