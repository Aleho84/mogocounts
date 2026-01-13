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
  useStore();

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="min-h-[100dvh] w-full bg-slate-950 flex justify-center">
        {/* App Shell (Vista Móvil en PC) */}
        <div
          className="w-full max-w-[720px] bg-slate-900 min-h-[100dvh] relative shadow-2xl border-x border-slate-800/50"
          style={{ transform: 'translateZ(0)' }}
        >
          <AnimatedRoutes />
          <BottomNav />
        </div>
      </div>
    </Router>
  );
}

export default App;
