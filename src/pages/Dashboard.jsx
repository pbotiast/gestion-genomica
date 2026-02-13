import React from 'react';
import { cn } from '../lib/utils';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const [stats, setStats] = React.useState({
        totalRequests: 0,
        pendingRequests: 0,
        invoicedRequests: 0,
        requestsPerYear: []
    });

    React.useEffect(() => {
        fetch('http://localhost:3000/api/dashboard/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Error fetching stats:", err));
    }, []);

    return (
        <div>
            <h1 className={cn(styles.title, "text-gradient")}>Panel de Control</h1>
            <div className={styles.grid}>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Solicitudes Totales</h3>
                    <p className={cn(styles.cardValue, styles.valueIndigo)}>{stats.totalRequests}</p>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Solicitudes Pendientes</h3>
                    <p className={cn(styles.cardValue, styles.valueCyan)}>{stats.pendingRequests}</p>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <h3 className={styles.cardTitle}>Solicitudes Facturadas</h3>
                    <p className={cn(styles.cardValue, styles.valuePink)}>{stats.invoicedRequests}</p>
                </div>
            </div>

            <div className={cn("glass-panel", styles.activitySection)}>
                <h2 className={styles.sectionTitle}>Solicitudes por Año</h2>
                {stats.requestsPerYear.length === 0 ? (
                    <p className={styles.emptyState}>No hay actividad registrada.</p>
                ) : (
                    <div className="overflow-hidden">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="p-3 text-slate-500 font-medium">Año</th>
                                        <th className="p-3 text-slate-500 font-medium">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.requestsPerYear.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                            <td className="p-3 text-slate-700 font-mono">{item.year || 'N/A'}</td>
                                            <td className="p-3 text-indigo-600 font-bold">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile List */}
                        <div className="md:hidden space-y-2">
                            {stats.requestsPerYear.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-slate-600 font-medium">Año {item.year || 'N/A'}</span>
                                    <span className="text-indigo-600 font-bold text-lg">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
