import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { LogOut, LayoutDashboard, Users, FileText, Settings, Database, TestTube, DollarSign, ClipboardList, Loader2, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Toaster } from 'sonner';
import styles from './Layout.module.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const { loading } = useAppContext();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Mobile Menu Button */}
            <button
                className={styles.mobileMenuButton}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(styles.sidebar, isMobileMenuOpen && styles.sidebarOpen)}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Genómica UCM</h1>
                    <p className={styles.subtitle}>Gestión de Unidad</p>
                </div>

                <nav className={styles.nav}>
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Panel de Control" onClick={closeMobileMenu} />
                    <NavItem to="/solicitudes" icon={<FileText size={20} />} label="Solicitudes" onClick={closeMobileMenu} />
                    <NavItem to="/investigadores" icon={<Users size={20} />} label="Investigadores" onClick={closeMobileMenu} />
                    <NavItem to="/usuarios" icon={<Users size={20} />} label="Usuarios Autorizados" onClick={closeMobileMenu} />
                    <NavItem to="/centros" icon={<Database size={20} />} label="Centros de Investigación" onClick={closeMobileMenu} />
                    <NavItem to="/servicios" icon={<TestTube size={20} />} label="Catálogo Servicios" onClick={closeMobileMenu} />
                    <NavItem to="/facturacion" icon={<DollarSign size={20} />} label="Facturación" onClick={closeMobileMenu} />
                    <div className={styles.navSectionTitle}>
                        Configuración
                    </div>
                    <NavItem to="/configuracion" icon={<Settings size={20} />} label="Ajustes Generales" onClick={closeMobileMenu} />
                    <NavItem to="/auditoria" icon={<ClipboardList size={20} />} label="Auditoría" onClick={closeMobileMenu} />
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.userProfileContent}>
                        <div className={styles.avatar}>
                            {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={styles.userName}>{user?.name || 'Usuario'}</p>
                            <p className={styles.userEmail}>{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.backgroundGradient} />
                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
};

const NavItem = ({ to, icon, label, onClick }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    styles.navItem,
                    isActive && styles.navItemActive
                )
            }
        >
            {icon}
            <span>{label}</span>
        </NavLink>
    );
};

export default Layout;
