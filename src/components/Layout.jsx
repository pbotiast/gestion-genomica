import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Database, TestTube } from 'lucide-react';
import { cn } from '../lib/utils';
import styles from './Layout.module.css';

const Layout = () => {
    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Genómica UCM</h1>
                    <p className={styles.subtitle}>Gestión de Unidad</p>
                </div>

                <nav className={styles.nav}>
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavItem to="/solicitudes" icon={<FileText size={20} />} label="Solicitudes" />
                    <NavItem to="/investigadores" icon={<Users size={20} />} label="Investigadores" />
                    <NavItem to="/servicios" icon={<TestTube size={20} />} label="Catálogo Servicios" />
                    <div className={styles.navSectionTitle}>
                        Configuración
                    </div>
                    <NavItem to="/configuracion" icon={<Settings size={20} />} label="Ajustes Generales" />
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.userProfileContent}>
                        <div className={styles.avatar}>
                            AD
                        </div>
                        <div>
                            <p className={styles.userName}>Administrador</p>
                            <p className={styles.userEmail}>admin@ucm.es</p>
                        </div>
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
