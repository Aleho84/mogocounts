import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import Button from '../components/ui/button';
import { Home, SearchX } from 'lucide-react';

const GroupNotFound = () => {
    const navigate = useNavigate();

    return (
        <PageTransition className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-slate-900">
            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <SearchX size={48} className="text-rose-500" />
            </div>

            <h1 className="text-3xl font-display font-bold text-white mb-2">Grupo no encontrado</h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                El enlace que intentas abrir no existe o ha sido eliminado.
            </p>

            <Button onClick={() => navigate('/')} className="w-full max-w-sm">
                <Home size={20} className="mr-2" />
                Volver al Inicio
            </Button>
        </PageTransition>
    );
};

export default GroupNotFound;
