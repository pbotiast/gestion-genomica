import React from 'react';
import { cn } from '../lib/utils';
import styles from './Dashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Clock, CheckCircle } from 'lucide-react';

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

    // Prepare data for charts
    const barData = stats.requestsPerYear.map(item => ({
        name: `Año ${item.year}`,
        Solicitudes: item.count
    })).reverse(); // Oldest first for chart

    const pieData = [
        { name: 'Pendientes', value: stats.pendingRequests, color: '#06b6d4' }, // Cyan
        { name: 'Facturadas', value: stats.invoicedRequests, color: '#db2777' }, // Pink
        { name: 'En Proceso', value: stats.totalRequests - stats.pendingRequests - stats.invoicedRequests, color: '#6366f1' } // Indigo (Using calculation for simplicity)
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <h1 className={cn(styles.title, "text-gradient")}>Panel de Control</h1>

            {/* KPI Cards */}
            <div className={styles.grid}>
                <div className={cn("glass-panel", styles.card)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Solicitudes</p>
                            <h3 className={cn(styles.cardValue, styles.valueIndigo)}>{stats.totalRequests}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Package size={24} />
                        </div>
                    </div>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Pendientes</p>
                            <h3 className={cn(styles.cardValue, styles.valueCyan)}>{stats.pendingRequests}</h3>
                        </div>
                        <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
                <div className={cn("glass-panel", styles.card)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Facturadas</p>
                            <h3 className={cn(styles.cardValue, styles.valuePink)}>{stats.invoicedRequests}</h3>
                        </div>
                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Bar Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Evolución Anual</h3>
                    <div className="h-64 w-full">
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="Solicitudes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No hay datos suficientes para mostrar el gráfico.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribución por Estado</h3>
                    <div className="h-64 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value, entry) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No hay datos suficientes para mostrar el gráfico.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity Table (Simplified) */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle por Año</h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-3 text-slate-500 font-medium text-sm">Año</th>
                                <th className="p-3 text-slate-500 font-medium text-sm">Cantidad Solicitudes</th>
                                <th className="p-3 text-slate-500 font-medium text-sm hidden md:table-cell">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.requestsPerYear.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-700 font-mono text-sm">{item.year || 'N/A'}</td>
                                    <td className="p-3 text-indigo-600 font-bold text-sm">{item.count}</td>
                                    <td className="p-3 text-slate-400 text-sm hidden md:table-cell">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${Math.min((item.count / stats.totalRequests) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.requestsPerYear.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-4 text-center text-slate-400 text-sm">No hay registros</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
