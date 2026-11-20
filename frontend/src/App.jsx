import { Route, Routes } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import Layout from './components/Layout.jsx'
import GamePage from './components/GamePage.jsx'
import ScrambleGame from './components/ScrambleGame.jsx'
import TriviaGame from './components/TriviaGame.jsx'
import Home from './pages/Home.jsx'
import News from './pages/News.jsx'
import Wiki from './pages/Wiki.jsx'
import Games from './pages/Games.jsx'
import Hangman from './pages/Hangman.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import Live from './pages/Live.jsx'
import Match from './pages/Match.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="news" element={<News />} />
        <Route path="live" element={<Live />} />
        <Route path="live/:league/:eventId" element={<Match />} />
        <Route path="wiki" element={<Wiki />} />
        <Route path="games" element={<Games />} />
        <Route path="games/hangman" element={<Hangman />} />
        <Route
          path="games/trivia"
          element={
            <GamePage title="Trivia">
              <TriviaGame />
            </GamePage>
          }
        />
        <Route
          path="games/scramble"
          element={
            <GamePage title="Word Scramble">
              <ScrambleGame />
            </GamePage>
          }
        />
        <Route path="more" element={<ComingSoon title="More Tools" icon={LayoutGrid} />} />
        <Route path="*" element={<ComingSoon title="Page not found" icon={LayoutGrid} />} />
      </Route>
    </Routes>
  )
}