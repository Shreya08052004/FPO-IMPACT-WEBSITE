import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Legend } from 'recharts'
import { Sprout, TrendingUp, Leaf, IndianRupee, Tractor, Droplets, MapPin, ChevronRight, LoaderCircle, ChartNoAxesCombined } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const number = n => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n || 0))

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>
}

export default function App() {
  const [options, setOptions] = useState({ districts: [], crops: [] })
  const [summary, setSummary] = useState(null)
  const [districtFilter, setDistrictFilter] = useState('All Districts')
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({ land_size: 2, soil_health: 5, rainfall: 1200, distance_market: 10, has_tractor: false, credit_access: false, district: '', crop: '' })

  useEffect(() => {
    Promise.all([axios.get(`${API}/api/options`), axios.get(`${API}/api/summary`)])
      .then(([o, s]) => {
        setOptions(o.data); setSummary(s.data)
        setForm(f => ({ ...f, district: o.data.districts.includes('Muradnagar') ? 'Muradnagar' : o.data.districts[0], crop: o.data.crops.includes('Wheat') ? 'Wheat' : o.data.crops[0] }))
      })
      .catch(() => setError('Could not connect to the Python API. Start the backend at http://127.0.0.1:8000 and refresh this page.'))
  }, [])

  useEffect(() => {
    axios.get(`${API}/api/impact`, { params: { district: districtFilter } }).then(r => setImpact(r.data)).catch(() => {})
  }, [districtFilter])

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const predict = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { const response = await axios.post(`${API}/api/predict`, form); setResult(response.data) }
    catch { setError('Prediction failed. Check that the backend is running and the form values are valid.') }
    finally { setLoading(false) }
  }

  const chartData = useMemo(() => (impact?.groups || []).map(g => ({
    group: g.group === 'Treatment' ? 'FPO members' : 'Control group',
    'Average income': Math.round(g.avg_income),
    'Average yield': Math.round(g.avg_yield),
    'Cultivation cost': Math.round(g.avg_cost)
  })), [impact])

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Sprout size={23}/></span><span>SAT<span className="brand-accent">-AGRI</span><small>FPO IMPACT ANALYZER</small></span></a>
      <nav><a href="#overview">Overview</a><a href="#predictor">Farm predictor</a><a href="#impact">Impact analysis</a></nav>
      <a className="nav-cta" href="#predictor">Analyze my farm <ChevronRight size={16}/></a>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> DATA-DRIVEN AGRICULTURE</div>
          <h1>Better decisions.<br/><em>Stronger farms.</em></h1>
          <p>Understand how Farmer Producer Organizations can shape farm income, productivity and cultivation costs — using your project's existing dataset and prediction model.</p>
          <div className="hero-actions"><a className="primary-btn" href="#predictor">Explore your farm <ChevronRight size={17}/></a><a className="text-link" href="#impact">View impact findings <span>↘</span></a></div>
          <div className="hero-proof"><span><span className="proof-check">✓</span> ML-powered estimates</span><span><span className="proof-check">✓</span> Farmer-focused insights</span></div>
        </div>
        <div className="hero-art">
          <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
          <div className="art-sun"></div>
          <div className="field field-back"></div><div className="field field-mid"></div><div className="field field-front"></div>
          <div className="floating-card card-top"><span className="mini-icon"><Leaf size={17}/></span><span><b>Farm-first insights</b><small>Built around your inputs</small></span></div>
          <div className="floating-card card-bottom"><span className="mini-chart">↗</span><span><small>Potential income uplift</small><b>Explore your estimate</b></span></div>
          <div className="hero-caption"><Sprout size={15}/> Growing opportunity together</div>
        </div>
      </section>

      <section className="stats-section" id="overview">
        <div className="section-heading"><div><span className="eyebrow">PROJECT AT A GLANCE</span><h2>What the data helps us explore</h2></div><p>Explore key indicators calculated from the dataset included in your original Streamlit project.</p></div>
        <div className="stats-grid">
          <Stat icon={IndianRupee} label="Estimated causal income coefficient" value={summary ? money(summary.causal_income_increase) : '—'} hint="Regression estimate from project data"/>
          <Stat icon={Leaf} label="Average NDVI change" value={summary ? Number(summary.ndvi_change).toFixed(3) : '—'} hint="Treatment-group before/after difference"/>
          <Stat icon={Sprout} label="Farmer records" value={summary ? number(summary.farmers) : '—'} hint="Unique farmer IDs in the dataset"/>
          <Stat icon={MapPin} label="Districts represented" value={summary ? number(summary.districts) : '—'} hint="Districts available for analysis"/>
        </div>
        <p className="note">Research note: these are estimates from the supplied project dataset and model, not guaranteed outcomes for an individual farmer.</p>
      </section>

      <section className="predictor-section" id="predictor">
        <div className="section-heading"><div><span className="eyebrow">PERSONALIZED FARM FORECAST</span><h2>What could your farm look like?</h2></div><p>Adjust your farm details to compare model estimates with and without FPO participation.</p></div>
        <div className="predictor-layout">
          <form className="form-panel" onSubmit={predict}>
            <div className="panel-title"><span className="panel-number">01</span><div><h3>Your farm profile</h3><p>Enter the details you know</p></div></div>
            <label className="field-label">Land size <strong>{form.land_size} hectares</strong><input type="range" min="0.5" max="10" step="0.1" value={form.land_size} onChange={e=>update('land_size',Number(e.target.value))}/><span className="range-ends"><span>0.5 ha</span><span>10 ha</span></span></label>
            <label className="field-label">Soil health score <strong>{form.soil_health}/10</strong><input type="range" min="1" max="10" step="0.1" value={form.soil_health} onChange={e=>update('soil_health',Number(e.target.value))}/><span className="range-ends"><span>Needs improvement</span><span>Healthy</span></span></label>
            <label className="field-label">Annual rainfall <strong>{number(form.rainfall)} mm</strong><input type="range" min="500" max="2500" step="50" value={form.rainfall} onChange={e=>update('rainfall',Number(e.target.value))}/><span className="range-ends"><span>500 mm</span><span>2,500 mm</span></span></label>
            <label className="field-label">Distance to market (km)<input type="number" min="1" max="50" value={form.distance_market} onChange={e=>update('distance_market',Number(e.target.value))} required/></label>
            <div className="field-row">
              <label className="field-label">District<select value={form.district} onChange={e=>update('district',e.target.value)}>{options.districts.map(x=><option key={x}>{x}</option>)}</select></label>
              <label className="field-label">Primary crop<select value={form.crop} onChange={e=>update('crop',e.target.value)}>{options.crops.map(x=><option key={x}>{x}</option>)}</select></label>
            </div>
            <div className="toggle-row"><div className="toggle-icon"><Tractor size={18}/></div><div className="toggle-copy"><b>Own a tractor?</b><small>Farm mechanisation access</small></div><button type="button" className={`switch ${form.has_tractor?'on':''}`} aria-pressed={form.has_tractor} onClick={()=>update('has_tractor',!form.has_tractor)}><span/></button></div>
            <div className="toggle-row"><div className="toggle-icon"><IndianRupee size={18}/></div><div className="toggle-copy"><b>Access to credit?</b><small>Formal or agricultural credit</small></div><button type="button" className={`switch ${form.credit_access?'on':''}`} aria-pressed={form.credit_access} onClick={()=>update('credit_access',!form.credit_access)}><span/></button></div>
            <button className="submit-btn" type="submit" disabled={loading || !form.district || !form.crop}>{loading ? <><LoaderCircle className="spin" size={18}/> Calculating…</> : <>Calculate my farm outlook <ChevronRight size={18}/></>}</button>
            {error && <div className="error-msg">{error}</div>}
          </form>

          <div className="results-panel">
            {!result ? <div className="empty-results"><div className="empty-icon"><ChartNoAxesCombined size={30}/></div><span className="eyebrow">YOUR RESULTS</span><h3>Your farm outlook starts here</h3><p>Complete your farm profile and calculate an estimate. We’ll compare projected income, yield and cultivation cost.</p><div className="empty-feature"><span>01</span> Income comparison</div><div className="empty-feature"><span>02</span> Yield and cost estimates</div><div className="empty-feature"><span>03</span> Ranked recommendations</div></div> :
              <div className="result-content">
                <div className="result-head"><div><span className="eyebrow">YOUR PERSONALIZED ESTIMATE</span><h3>Farm outlook</h3></div><span className="result-tag"><Sprout size={14}/> Model result</span></div>
                <div className="gain-card"><div><span>Estimated annual income difference</span><h2>{money(result.income_gain)}</h2><p>Estimated difference between the two model scenarios</p></div><div className="gain-icon"><TrendingUp size={26}/></div></div>
                <div className="compare-grid"><div className="compare-card"><span className="compare-label">WITHOUT FPO</span><b>{money(result.without_fpo.income)}</b><small>Estimated annual income</small><div className="compare-line"><span style={{width:'70%'}}/></div></div><div className="compare-card highlight"><span className="compare-label">WITH FPO</span><b>{money(result.with_fpo.income)}</b><small>Estimated annual income</small><div className="compare-line"><span style={{width:'88%'}}/></div></div></div>
                <div className="mini-metrics"><div><span>Yield estimate</span><b>{number(result.with_fpo.yield)} kg/ha</b><small>With FPO scenario</small></div><div><span>Cultivation cost</span><b>{money(result.with_fpo.cost)}</b><small>With FPO scenario</small></div></div>
                <div className="recommendations"><h4><Sprout size={17}/> Recommendations to explore</h4><p>Ranked by the model's estimated income difference for each simulated change.</p>{result.recommendations.map((r,i)=><div className="recommendation" key={r.title}><span className="rec-rank">0{i+1}</span><span className="rec-title">{r.title}</span><b>{money(r.gain)}</b></div>)}</div>
                <p className="note">These are model-based scenario estimates, not promises or financial advice. Validate recommendations with local agricultural experts.</p>
              </div>}
          </div>
        </div>
      </section>

      <section className="impact-section" id="impact">
        <div className="section-heading"><div><span className="eyebrow">THE EVIDENCE</span><h2>Explore the impact by district</h2></div><p>Compare summary outcomes between treatment and control records in the included dataset.</p></div>
        <div className="chart-panel">
          <div className="chart-head"><div><h3>Average annual income</h3><p>Mean income by group, using the selected district's records</p></div><select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}><option>All Districts</option>{options.districts.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="chart-wrap"><ResponsiveContainer width="100%" height={290}><BarChart data={chartData} margin={{top:12,right:18,left:10,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eee8"/><XAxis dataKey="group" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={v=>`₹${Math.round(v/1000)}k`} width={58}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="Average income" fill="#2f7951" radius={[7,7,0,0]} barSize={68}/></BarChart></ResponsiveContainer></div>
          <div className="impact-metrics">{(impact?.groups||[]).map(g=><div className="impact-metric" key={g.group}><span className={`group-dot ${g.group==='Treatment'?'green':'gray'}`}/><div><b>{g.group==='Treatment'?'FPO members':'Control group'}</b><small>Avg. yield: {number(g.avg_yield)} kg/ha</small></div><strong>{money(g.avg_income)}</strong></div>)}</div>
        </div>
        <div className="impact-bottom"><div className="impact-callout"><div className="callout-icon"><Droplets size={22}/></div><div><h3>Data-led agricultural insights</h3><p>The dashboard brings income, productivity, cultivation cost, credit access and training indicators together to support exploration of FPO outcomes.</p></div></div><div className="impact-note"><b>How to read this analysis</b><p>Group averages describe the included dataset. They should not be interpreted as definitive causal proof without checking study design, assumptions, and data quality.</p></div></div>
      </section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Sprout size={20}/></span><span>SAT<span className="brand-accent">-AGRI</span><small>FPO IMPACT ANALYZER</small></span></a><p>Supporting informed decisions for stronger farming communities.</p><span>React · FastAPI · Python ML</span></footer>
  </div>
}
