import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AppErrorBoundary } from './components/system/AppErrorBoundary'
import { PageDataGate } from './components/system/PageDataGate'
import { LoadingState } from './components/ui/LoadingState'
import { routePages } from './config/navigation'

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const CapitalRotation = lazy(() => import('./pages/CapitalRotation').then((module) => ({ default: module.CapitalRotation })))
const StockDetail = lazy(() => import('./pages/StockDetail').then((module) => ({ default: module.StockDetail })))
const Watchlist = lazy(() => import('./pages/Watchlist').then((module) => ({ default: module.Watchlist })))
const MarketFocus = lazy(() => import('./pages/MarketFocus').then((module) => ({ default: module.MarketFocus })))
const GubaoPage = lazy(() => import('./pages/GubaoPage').then((module) => ({ default: module.GubaoPage })))
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })))
const EmptyPage = lazy(() => import('./pages/EmptyPage').then((module) => ({ default: module.EmptyPage })))

type Resource = 'overview' | 'stocks' | 'industries' | 'events'
const completedPaths = new Set(['/capital-flow', '/market-focus', '/watchlist', '/ai', '/settings'])

function RouteShell({ resource, children }: { resource: Resource; children: ReactNode }) {
  return <AppErrorBoundary><Suspense fallback={<div className="panel"><LoadingState rows={6}/></div>}><PageDataGate resource={resource}>{children}</PageDataGate></Suspense></AppErrorBoundary>
}

export default function App() {
  return <Routes><Route element={<AppLayout/>}>
    <Route index element={<RouteShell resource="overview"><Dashboard/></RouteShell>}/>
    <Route path="/capital-flow" element={<RouteShell resource="industries"><CapitalRotation/></RouteShell>}/>
    <Route path="/market-focus" element={<RouteShell resource="events"><MarketFocus/></RouteShell>}/>
    <Route path="/stock/:symbol" element={<RouteShell resource="stocks"><StockDetail/></RouteShell>}/>
    <Route path="/watchlist" element={<RouteShell resource="stocks"><Watchlist/></RouteShell>}/>
    <Route path="/ai" element={<RouteShell resource="overview"><GubaoPage/></RouteShell>}/>
    <Route path="/settings" element={<RouteShell resource="overview"><Settings/></RouteShell>}/>
    <Route path="/ai-assistant" element={<Navigate to="/ai" replace/>}/>
    {routePages.filter((page) => !completedPaths.has(page.path)).map((page) => <Route key={page.path} path={page.path} element={<RouteShell resource="overview"><EmptyPage page={page}/></RouteShell>}/>) }
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>
}
