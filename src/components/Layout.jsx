import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Users, FileText, Settings, Database, TestTube, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './Layout.module.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Genómica UCM</h1>
                    <p className={styles.subtitle}>Gestión de Unidad</p>
                </div>

                <nav className={styles.nav}>
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Panel de Control" />
                    <NavItem to="/solicitudes" icon={<FileText size={20} />} label="Solicitudes" />
                    <NavItem to="/investigadores" icon={<Users size={20} />} label="Investigadores" />
                    <NavItem to="/usuarios" icon={<Users size={20} />} label="Usuarios Autorizados" />
                    <NavItem to="/servicios" icon={<TestTube size={20} />} label="Catálogo Servicios" />
                    <NavItem to="/facturacion" icon={<DollarSign size={20} />} label="Facturación" />
                    <div className={styles.navSectionTitle}>
                        Configuración
                    </div>
                    <NavItem to="/configuracion" icon={<Settings size={20} />} label="Ajustes Generales" />
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
        </div>
    );
};

const NavItem = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
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
