import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { EmptyPage } from './pages/EmptyPage'
import { CapitalRotation } from './pages/CapitalRotation'
import { StockDetail } from './pages/StockDetail'
import { routePages } from './config/navigation'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/capital-flow" element={<CapitalRotation />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
        {routePages.filter((page) => page.path !== '/capital-flow').map((page) => (
          <Route key={page.path} path={page.path} element={<EmptyPage page={page} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
