import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import styles from './Dashboard.module.css';
import { KPICard, Card } from '../components/UI';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Clock, CheckCircle, FileText, TrendingUp, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { exportDashboardPDF, exportDashboardExcel } from '../lib/dashboardExport';
import { api } from '../lib/api';

const Dashboard = () => {
    const [period, setPeriod] = useState('month'); // week, month, quarter, year, all
    const [stats, setStats] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        invoicedRequests: 0,
        requestsPerYear: [],
        revenuePerMonth: [],
        servicePopularity: [],
        trendData: [],
        centerStats: [],
        tariffDistribution: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get(`/dashboard/stats?period=${period}`);
                setStats(data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, [period]);

    const handleExportPDF = () => {
        exportDashboardPDF(stats, period);
    };

    const handleExportExcel = async () => {
        await exportDashboardExcel(stats, period);
    };

    // Prepare data for charts
    const barData = stats.requestsPerYear.map(item => ({
        name: `Año ${item.year}`,
        Solicitudes: item.count
    })).reverse();

    const revenueData = (stats.revenuePerMonth || []).map(item => ({
        name: item.month,
        Ingresos: item.revenue
    }));

    const serviceData = (stats.servicePopularity || []).slice(0, 5).map((item, index) => ({
        name: item.name,
        value: item.count,
        color: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'][index % 5]
    }));

    const pieData = [
        { name: 'Pendientes', value: stats.pendingRequests, color: '#06b6d4' },
        { name: 'Facturadas', value: stats.invoicedRequests, color: '#10b981' },
        { name: 'En Proceso', value: stats.totalRequests - stats.pendingRequests - stats.invoicedRequests, color: '#6366f1' }
    ].filter(d => d.value > 0);

    // Trend data for line chart
    const trendData = (stats.trendData || []).map(item => ({
        name: item.period,
        Solicitudes: item.count
    }));

    // Center statistics
    const centerData = (stats.centerStats || []).slice(0, 5).map(item => ({
        name: item.centerName || 'Sin Centro',
        Solicitudes: item.count,
        Ingresos: item.revenue || 0
    }));

    // Tariff distribution
    const tariffData = (stats.tariffDistribution || []).map(item => ({
        name: `Tarifa ${item.tariff}`,
        value: item.count,
        color: item.tariff === 'A' ? '#10b981' : item.tariff === 'B' ? '#f59e0b' : '#ef4444'
    })).filter(d => d.value > 0);

    const inProcessCount = stats.totalRequests - stats.pendingRequests - stats.invoicedRequests;

    const handleExport = () => {
        // TODO: Implement export functionality
        alert('Funcionalidad de exportación en desarrollo');
    };

    const getPeriodLabel = () => {
        const labels = {
            week: 'Última Semana',
            month: 'Último Mes',
            quarter: 'Último Trimestre',
            year: 'Último Año',
            all: 'Todo el Histórico'
        };
        return labels[period] || 'Último Mes';
    };

    return (
        <div className="space-y-6 fade-in">
            {/* Header with Period Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={cn(styles.title, "text-gradient")}>Panel de Control</h1>
                    <div className="text-sm text-gray-500">
                        Período: {getPeriodLabel()} • Última actualización: {new Date().toLocaleTimeString('es-ES')}
                    </div>
                </div>

                <div className="flex gap-3">
                    {/* Period Selector */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="quarter">Último trimestre</option>
                            <option value="year">Último año</option>
                            <option value="all">Todo el histórico</option>
                        </select>
                    </div>

                    {/* Export Buttons */}
                    <button
                        onClick={handleExportPDF}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Download size={18} />
                        PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FileSpreadsheet size={18} />
                        Excel
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
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
                    icon={Package}
                    color="purple"
                />
            </div>

            {/* Charts Section Row 1: Trends & Center Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Line Chart - NEW */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-500" />
                        Tendencia Temporal
                    </h3>
                    <div className="h-64 w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
                                    <Line
                                        type="monotone"
                                        dataKey="Solicitudes"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={{ fill: '#6366f1', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos de tendencia
                            </div>
                        )}
                    </div>
                </Card>

                {/* Statistics by Center - NEW */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Centros</h3>
                    <div className="h-64 w-full">
                        {centerData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={centerData} layout="vertical">
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
                                        width={120}
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
                                    <Bar dataKey="Solicitudes" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Sin datos por centro
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Charts Section Row 2 */}
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

            {/* Charts Section Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tariff Distribution Pie - NEW */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribución por Tarifa</h3>
                    <div className="h-

64 w-full">
                        {tariffData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tariffData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {tariffData.map((entry, index) => (
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
                                Sin datos de tarifas
                            </div>
                        )}
                    </div>
                </Card>

                {/* Service Popularity */}
                <Card hover={false} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Servicios</h3>
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
