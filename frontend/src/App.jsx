import { Route, Routes } from 'react-router-dom'
import { Gamepad2, LayoutGrid } from 'lucide-react'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import News from './pages/News.jsx'
import Wiki from './pages/Wiki.jsx'
import ComingSoon from './pages/ComingSoon.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="news" element={<News />} />
        <Route path="wiki" element={<Wiki />} />
        <Route path="games" element={<ComingSoon title="Games" icon={Gamepad2} />} />
        <Route path="more" element={<ComingSoon title="More Tools" icon={LayoutGrid} />} />
        <Route path="*" element={<ComingSoon title="Page not found" icon={LayoutGrid} />} />
      </Route>
    </Routes>
  )
}