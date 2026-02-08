import React from 'react';
import { cn } from '../lib/utils';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    return (
        <div>
            <h1 className={cn(styles.title, "text-gradient")}>Panel de Control</h1>
            <div className={styles.grid}>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Solicitudes Pendientes</h3>
                    <p className={cn(styles.cardValue, styles.valueIndigo)}>0</p>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Investigadores Activos</h3>
                    <p className={cn(styles.cardValue, styles.valueCyan)}>0</p>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Servicios Realizados</h3>
                    <p className={cn(styles.cardValue, styles.valuePink)}>0</p>
                </div>
            </div>

            <div className={cn("glass-panel", styles.activitySection)}>
                <h2 className={styles.sectionTitle}>Actividad Reciente</h2>
                <p className={styles.emptyState}>No hay actividad reciente registrada.</p>
            </div>
        </div>
    );
};

export default Dashboard;
