import { Navigate, createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MePage from './pages/MePage.jsx'
import DiscoverPage from './pages/DiscoverPage.jsx'
import SongsPage from './pages/SongsPage.jsx'
import SongDetailsPage from './pages/SongDetailsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import FriendsPage from './pages/FriendsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'account', element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'me', element: <MePage /> },
      { path: 'discover', element: <DiscoverPage /> },
      { path: 'songs', element: <SongsPage /> },
      { path: 'songs/:songId', element: <SongDetailsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'friends', element: <FriendsPage /> },
      { path: 'profiles/:userId', element: <ProfilePage /> }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
])
