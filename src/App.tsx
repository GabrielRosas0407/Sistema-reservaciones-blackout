import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Home from './pages/home'
import Eventos from './pages/eventos'
import Galeria from './pages/galeria'
import Info from './pages/info'
import Reservacion from './pages/reservacion'
import Admin from './pages/admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/reservaciones" element={<Reservacion />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/info" element={<Info />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
