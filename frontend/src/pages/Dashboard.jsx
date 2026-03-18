import React, { useEffect, useState, useCallback } from 'react'
import { getDashboard, getDashboardStats } from '../api/dashboard'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Boxes, ClipboardList, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart
} from 'recharts'

const PERIODS = [
  { key: 'week',    label: 'Cette semaine' },
  { key: 'month',   label: 'Ce mois' },
  { key: '3months', label: '3 derniers mois' },
  { key: 'year',    label: 'Cette année' },
  { key: 'all',     label: 'Tout' },
]

const StatCard = ({ icon: Icon, label, value, color, bgColor, sub }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchKpis = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch {
      setError('Impossible de charger le tableau de bord.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = useCallback(async (p) => {
    setStatsLoading(true)
    try {
      const res = await getDashboardStats(p)
      setStats(res.data)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpis() }, [])
  useEffect(() => { fetchStats(period) }, [period, fetchStats])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchKpis} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    )
  }

  const currentPeriodLabel = PERIODS.find(p => p.key === period)?.label

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble du stock</p>
        </div>
        <button onClick={() => { fetchKpis(); fetchStats(period) }} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Stock Total" value={data?.totalStock ?? 0}
          color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard icon={Package} label="Produits" value={data?.totalProducts ?? 0}
          color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard icon={AlertTriangle} label="Stock Faible (≤5)" value={data?.lowStockCount ?? 0}
          color={data?.lowStockCount > 0 ? "text-red-600" : "text-gray-400"}
          bgColor={data?.lowStockCount > 0 ? "bg-red-50" : "bg-gray-50"} />
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Écarts inventaire</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-red-600">▼ {data?.negativeGapCount ?? 0}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bold text-orange-500">▲ {data?.positiveGapCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Stats Section */}
      <div className="card">
        {/* Period selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Activité du stock</h2>
          </div>
          <div className="flex gap-1 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period KPIs */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">Entrées — {currentPeriodLabel}</p>
                <p className="text-2xl font-bold text-green-700 mt-1">+{stats.entriesTotal}</p>
              </div>
              <TrendingUp size={28} className="text-green-400" />
            </div>
            <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">Sorties — {currentPeriodLabel}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">-{stats.exitsTotal}</p>
              </div>
              <TrendingDown size={28} className="text-red-300" />
            </div>
          </div>
        )}

        {/* Chart */}
        {statsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats?.chartData?.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(value, name) => [value, name === 'entries' ? 'Entrées' : 'Sorties']}
                labelFormatter={(label) => `Période : ${label}`}
              />
              <Legend formatter={(val) => val === 'entries' ? 'Entrées' : 'Sorties'} />
              <Area type="monotone" dataKey="entries" stroke="#22c55e" strokeWidth={2}
                fill="url(#colorEntries)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="exits" stroke="#ef4444" strokeWidth={2}
                fill="url(#colorExits)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Aucune activité sur cette période
          </div>
        )}
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Entries */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Dernières Entrées</h2>
          </div>
          {data?.recentEntries?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucune entrée récente</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Produit</th>
                    <th className="table-header">Quantité</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.recentEntries?.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{entry.productName}</td>
                      <td className="table-cell">
                        <span className="text-green-600 font-semibold">+{entry.quantity}</span>
                      </td>
                      <td className="table-cell text-gray-500">{formatDate(entry.dateEntry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Exits */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">Dernières Sorties</h2>
          </div>
          {data?.recentExits?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Aucune sortie récente</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Produit</th>
                    <th className="table-header">Quantité</th>
                    <th className="table-header">Bénéficiaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.recentExits?.map(exit => (
                    <tr key={exit.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{exit.productName}</td>
                      <td className="table-cell">
                        <span className="text-red-500 font-semibold">-{exit.quantity}</span>
                      </td>
                      <td className="table-cell text-gray-500">{exit.beneficiary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
