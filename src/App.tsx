import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppErrorBoundary } from './components/system/AppErrorBoundary'
import { PageDataGate } from './components/system/PageDataGate'
import { LoadingState } from './components/ui/LoadingState'
import { historyPage, routePages } from './config/navigation'

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const CapitalRotation = lazy(() => import('./pages/CapitalRotation').then((module) => ({ default: module.CapitalRotation })))
const StockDetailWithSnapshot = lazy(() => import('./pages/StockDetailWithSnapshot').then((module) => ({ default: module.StockDetailWithSnapshot })))
const WatchlistDashboard = lazy(() => import('./pages/WatchlistDashboard').then((module) => ({ default: module.WatchlistDashboard })))
const MarketFocus = lazy(() => import('./pages/MarketFocus').then((module) => ({ default: module.MarketFocus })))
const GubaoPageWithDecision = lazy(() => import('./pages/GubaoPageWithDecision').then((module) => ({ default: module.GubaoPageWithDecision })))
const SettingsWithDecision = lazy(() => import('./pages/SettingsWithDecision').then((module) => ({ default: module.SettingsWithDecision })))
const MarketHistory = lazy(() => import('./pages/MarketHistory').then((module) => ({ default: module.MarketHistory })))
const IndustryOverview = lazy(() => import('./pages/IndustryOverview').then((module) => ({ default: module.IndustryOverview })))
const IndustryDetail = lazy(() => import('./pages/IndustryDetail').then((module) => ({ default: module.IndustryDetail })))
const StockDataStatus = lazy(() => import('./pages/StockDataStatus').then((module) => ({ default: module.StockDataStatus })))
const StockSnapshotOverview = lazy(() => import('./pages/StockSnapshotOverview').then((module) => ({ default: module.StockSnapshotOverview })))
const DecisionCenter = lazy(() => import('./pages/DecisionCenter').then((module) => ({ default: module.DecisionCenter })))
const DataCoverage = lazy(() => import('./pages/DataCoverage').then((module) => ({ default: module.DataCoverage })))
const SmartScreener = lazy(() => import('./pages/SmartScreener').then((module) => ({ default: module.SmartScreener })))
const EmptyPage = lazy(() => import('./pages/EmptyPage').then((module) => ({ default: module.EmptyPage })))

type Resource = 'overview' | 'stocks' | 'industries' | 'events'
const completedPaths = new Set(['/capital-flow', '/market-focus', '/watchlist', '/ai', '/settings', '/history', '/industries', '/data-status/stocks', '/stock-snapshots', '/decisions', '/data-coverage', '/screener'])

function RouteShell({ resource, children, dataGate = true, dashboard = false }: { resource: Resource; children: ReactNode; dataGate?: boolean; dashboard?: boolean }) {
  return <AppErrorBoundary><Suspense fallback={<div className="panel"><LoadingState rows={6}/></div>}>{dataGate ? <PageDataGate resource={resource} variant={dashboard ? 'dashboard' : 'default'}>{children}</PageDataGate> : children}</Suspense></AppErrorBoundary>
}

export default function App() {
  return <Routes><Route element={<AppLayout/>}>
    <Route index element={<RouteShell resource="overview" dashboard><Dashboard/></RouteShell>}/>
    <Route path="/capital-flow" element={<RouteShell resource="industries"><CapitalRotation/></RouteShell>}/>
    <Route path="/market-focus" element={<RouteShell resource="events"><MarketFocus/></RouteShell>}/>
    <Route path="/stock/:symbol" element={<RouteShell resource="stocks" dataGate={false}><StockDetailWithSnapshot/></RouteShell>}/>
    <Route path="/watchlist" element={<RouteShell resource="stocks"><WatchlistDashboard/></RouteShell>}/>
    <Route path="/ai" element={<RouteShell resource="overview"><GubaoPageWithDecision/></RouteShell>}/>
    <Route path="/settings" element={<RouteShell resource="overview"><SettingsWithDecision/></RouteShell>}/>
    <Route path={historyPage.path} element={<RouteShell resource="overview"><MarketHistory/></RouteShell>}/>
    <Route path="/industries" element={<RouteShell resource="industries"><IndustryOverview/></RouteShell>}/>
    <Route path="/industries/:industryId" element={<RouteShell resource="industries"><IndustryDetail/></RouteShell>}/>
    <Route path="/data-status/stocks" element={<RouteShell resource="stocks"><StockDataStatus/></RouteShell>}/>
    <Route path="/stock-snapshots" element={<RouteShell resource="stocks"><StockSnapshotOverview/></RouteShell>}/>
    <Route path="/decisions" element={<RouteShell resource="overview"><DecisionCenter/></RouteShell>}/>
    <Route path="/data-coverage" element={<RouteShell resource="overview"><DataCoverage/></RouteShell>}/>
    <Route path="/screener" element={<RouteShell resource="stocks"><SmartScreener/></RouteShell>}/>
    <Route path="/ai-assistant" element={<Navigate to="/ai" replace/>}/>
    {routePages.filter((page) => !completedPaths.has(page.path)).map((page) => <Route key={page.path} path={page.path} element={<RouteShell resource="overview"><EmptyPage page={page}/></RouteShell>}/>) }
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>
}
