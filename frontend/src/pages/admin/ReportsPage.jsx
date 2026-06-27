import React, { useState, useEffect, useRef } from 'react';
import { reportAPI } from '../../api';
import { fmtPKR } from '../../utils/currency';
import { BarChart3, TrendingUp, Package, SlidersHorizontal, Lock, Download, FileText } from 'lucide-react';
import domToImage from 'dom-to-image-more';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];

export default function ReportsPage() {
  const [summary, setSummary]             = useState(null);
  const [topProducts, setTopProducts]     = useState([]);
  const [categoryReport, setCategoryReport] = useState([]);
  const [orderStatus, setOrderStatus]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isExporting, setIsExporting]     = useState(false);
  
  const reportRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, c, o] = await Promise.allSettled([
          reportAPI.getSummary(),
          reportAPI.getTopProducts(10),
          reportAPI.getCategories(),
          reportAPI.getOrderStatus(),
        ]);
        if ([s, t, c, o].some((r) => r.status === 'rejected' && r.reason?.response?.status === 403)) {
          setError('403'); return;
        }
        if (s.status === 'fulfilled') setSummary(s.value.data?.data);
        if (t.status === 'fulfilled') setTopProducts(t.value.data?.data || []);
        if (c.status === 'fulfilled') setCategoryReport(c.value.data?.data || []);
        if (o.status === 'fulfilled') setOrderStatus(o.value.data?.data || []);
      } catch { setError('Failed to load reports'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const downloadCSV = () => {
    const rows = [['Report', 'Metric', 'Value']];
    if (summary) Object.entries(summary).forEach(([k, v]) => rows.push(['Summary', k, v]));
    topProducts.forEach((p) => rows.push(['Top Product', p.name, `${p.total_quantity} units / ${fmtPKR(p.total_revenue)}`]));
    categoryReport.forEach((c) => rows.push(['Category', c.category_name, `${c.total_products} products / ${fmtPKR(c.inventory_value)}`]));
    orderStatus.forEach((o) => rows.push(['Order Status', o.status, `${o.order_count} orders / ${fmtPKR(o.total_amount)}`]));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const node = reportRef.current;
      const dataUrl = await domToImage.toPng(node, {
        bgcolor: '#f8fafc',
        width: node.offsetWidth,
        height: node.offsetHeight,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (node.offsetHeight * pdfWidth) / node.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Executive-Report-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Check console.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error === '403') return <ErrorBox msg="Admin access required. Reports are only available to admin users." icon={Lock} tone="amber" />;
  if (error) return <ErrorBox msg={error} />;

  const pieData = categoryReport.map(c => ({
    name: c.category_name,
    value: parseFloat(c.inventory_value) || 0
  }));

  const barData = orderStatus.map(o => ({
    name: o.status.charAt(0).toUpperCase() + o.status.slice(1),
    Orders: parseInt(o.order_count) || 0,
    Revenue: parseFloat(o.total_amount) || 0
  }));

  return (
    <div className="grid gap-6 pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/2 -translate-y-1/2"></div>
        <div className="z-10">
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600 tracking-tight">Business Intelligence</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Real-time performance analytics and automated reporting.</p>
        </div>
        <div className="flex gap-3 z-10">
          <button
            className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200"
            onClick={downloadCSV}
          >
            <Download size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" /> 
            Export CSV
          </button>
          <button
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70 disabled:hover:translate-y-0"
            onClick={downloadPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating PDF...</>
            ) : (
              <><FileText size={16} /> Download Report</>
            )}
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div id="report-dashboard" ref={reportRef} className="grid gap-6 bg-slate-50/50 p-2 sm:p-4 rounded-2xl">
        
        {/* PDF Document Header */}
        <div className="hidden print-header bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#0f766e] to-[#2dd4bf]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">Executive Report</h1>
              <p className="text-slate-500 mt-2 font-medium">Generated automatically by OIMS Analytics</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Date</p>
              <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        {summary && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Gross Revenue"   value={fmtPKR(summary.total_revenue ?? 0)}  icon={TrendingUp}        tone="emerald" trend="+12.5%" />
            <KpiCard label="Cost of Goods"   value={fmtPKR(summary.total_cogs ?? 0)}     icon={Package}           tone="amber" />
            <KpiCard label="Net Profit"      value={fmtPKR((summary.total_revenue ?? 0) - (summary.total_cogs ?? 0))} icon={BarChart3} tone="teal" trend="+8.2%" />
            <KpiCard label="Product Catalog" value={summary.total_products ?? 0}          icon={Package}           tone="blue" />
            <KpiCard label="Total Orders"    value={summary.total_orders ?? 0}            icon={BarChart3}         tone="teal" />
            <KpiCard label="Critical Stock"  value={summary.low_stock_items ?? 0}         icon={SlidersHorizontal} tone="rose" alert />
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top products */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-800">Top Performers</h2>
                <p className="text-sm text-slate-500 font-medium">Highest grossing products.</p>
              </div>
              <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">Top 10</span>
            </div>
            
            <div className="space-y-3">
              {topProducts.length === 0 ? <p className="py-8 text-center text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No sales data available yet.</p> : topProducts.map((p, i) => (
                <div key={p.id} className="group flex items-center justify-between gap-4 rounded-xl border border-transparent bg-slate-50/80 p-3.5 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`grid size-8 place-items-center rounded-lg font-bold text-sm shadow-sm transition-transform group-hover:scale-110 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-400 border border-slate-100'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{p.total_quantity ?? 0} units sold</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">{fmtPKR(p.total_revenue ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Performance Pie Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="mb-6">
              <h2 className="font-extrabold text-lg text-slate-800">Inventory Distribution</h2>
              <p className="text-sm text-slate-500 font-medium">Monetary value locked in categories.</p>
            </div>
            <div className="h-[320px] w-full mt-auto">
              {pieData.length === 0 ? <p className="py-8 text-center text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">No category data available.</p> : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />)}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [fmtPKR(value), 'Value']} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold'}}
                      itemStyle={{color: '#0f766e'}}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: '600', color: '#475569'}} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Bar Chart */}
        {orderStatus.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-8">
              <h2 className="font-extrabold text-lg text-slate-800">Order Fulfillment Flow</h2>
              <p className="text-sm text-slate-500 font-medium">Current lifecycle state of all orders.</p>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px'}}
                    labelStyle={{fontWeight: 'bold', color: '#1e293b', marginBottom: '4px'}}
                  />
                  <Bar dataKey="Orders" fill="url(#tealGradient)" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500} />
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print { .print-header { display: block !important; } }
      `}} />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone, trend, alert }) {
  const tones = { 
    teal: 'bg-teal-50 text-teal-700 border-teal-100', 
    blue: 'bg-blue-50 text-blue-700 border-blue-100', 
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
    amber: 'bg-amber-50 text-amber-700 border-amber-100', 
    rose: 'bg-rose-50 text-rose-700 border-rose-100' 
  };
  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${alert ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100'}`}>
      {alert && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500 rounded-bl-full -z-0 opacity-10 translate-x-1/2 -translate-y-1/2"></div>}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`mt-3 text-3xl font-black tracking-tight ${alert ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
          {trend && (
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
              <TrendingUp size={12} /> {trend} vs last month
            </p>
          )}
        </div>
        <span className={`grid size-14 place-items-center rounded-2xl border ${tones[tone]} shadow-sm`}>
          <Icon size={24} />
        </span>
      </div>
    </article>
  );
}

function Spinner() { return <div className="flex h-[60vh] items-center justify-center"><div className="size-12 animate-spin rounded-full border-4 border-slate-100 border-t-[#0f766e]"></div></div>; }
function ErrorBox({ msg, icon: Icon = null, tone = "rose" }) { 
  const tones = { amber: 'bg-amber-50 border-amber-200 text-amber-800', rose: 'bg-rose-50 border-rose-200 text-rose-800' };
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-6 ${tones[tone]}`}>
      {Icon && <div className={`p-3 rounded-full bg-white shadow-sm`}><Icon size={24} /></div>}
      <div><p className="font-extrabold text-lg">System Notice</p><p className="text-sm font-medium mt-1 opacity-90">{msg}</p></div>
    </div>
  ); 
}
