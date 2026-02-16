import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import styles from './Dashboard.module.css';
import { KPICard, Card } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Clock, CheckCircle, FileText, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        invoicedRequests: 0,
        requestsPerYear: [],
        revenuePerMonth: [],
        servicePopularity: []
    });

    useEffect(() => {
        fetch('http://localhost:3000/api/dashboard/stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Error fetching stats:", err));
    }, []);

    // Prepare data for charts
    const barData = stats.requestsPerYear.map(item => ({
        name: `Año ${item.year}`,
        Solicitudes: item.count
    })).reverse();

    const revenueData = (stats.revenuePerMonth || []).map(item => ({
        name: item.month,
        Ingresos: item.revenue
    }));

    const serviceData = (stats.servicePopularity || []).map((item, index) => ({
        name: item.name,
        value: item.count,
        color: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'][index % 5]
    }));

    const pieData = [
        { name: 'Pendientes', value: stats.pendingRequests, color: '#06b6d4' },
        { name: 'Facturadas', value: stats.invoicedRequests, color: '#db2777' },
        { name: 'En Proceso', value: stats.totalRequests - stats.pendingRequests - stats.invoicedRequests, color: '#6366f1' }
    ].filter(d => d.value > 0);

    const inProcessCount = stats.totalRequests - stats.pendingRequests - stats.invoicedRequests;

    return (
        <div className="space-y-6 fade-in">
            <div className="flex justify-between items-center">
                <h1 className={cn(styles.title, "text-gradient")}>Panel de Control</h1>
                <div className="text-sm text-gray-500">
                    Última actualización: {new Date().toLocaleTimeString('es-ES')}
                </div>
            </div>

            {/* KPI Cards - Professional Version with animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Solicitudes"
                    value={stats.totalRequests}
                    trend="up"
                    trendValue="+12.5%"
                    icon={FileText}
                    color="indigo"
                />
                <KPICard
                    title="Pendientes"
                    value={stats.pendingRequests}
                    trend="neutral"
                    icon={Clock}
                    color="cyan"
                />
                <KPICard
                    title="Facturadas"
                    value={stats.invoicedRequests}
                    trend="up"
                    trendValue="+8.2%"
                    icon={CheckCircle}
                    color="green"
                />
                <KPICard
                    title="En Proceso"
                    value={inProcessCount}
                    trend="neutral"
                    icon={Package}
                    color="purple"
                />
            </div>

            {/* Charts Section Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-500" />
                        Ingresos Mensuales (€)
                    </h3>
                    <div className="h-64 w-full">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value) => [`€${value.toFixed(2)}`, 'Ingresos']}
                                    />
                                    <Bar
                                        dataKey="Ingresos"
                                        fill="url(#colorRevenue)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos de ingresos
                            </div>
                        )}
                    </div>
                </Card>

                {/* Requests Per Year */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Solicitudes por Año</h3>
                    <div className="h-64 w-full">
                        {barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar
                                        dataKey="Solicitudes"
                                        fill="url(#colorRequests)"
                                        radius={[8, 8, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Charts Section Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Status Pie Chart */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribución por Estado</h3>
                    <div className="h-64 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos
                            </div>
                        )}
                    </div>
                </Card>

                {/* Service Popularity */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Servicios Más Solicitados</h3>
                    <div className="h-64 w-full">
                        {serviceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviceData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={150}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value) => [`${value} solicitudes`, 'Cantidad']}
                                    />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
