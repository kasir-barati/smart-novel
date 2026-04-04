import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { CallbackPage } from '../pages/auth/CallbackPage';
import { HomePage } from '../pages/home/HomePage';
import { NovelPage } from '../pages/novel/NovelPage';
import { TtsReviewPage } from '../pages/novel/TtsReviewPage';
import { SearchPage } from '../pages/search/SearchPage';
import { Layout } from './layout/Layout';

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Routes with Layout (Header + Footer) */}
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <SearchPage />
            </Layout>
          }
        />

        {/* Auth callback route */}
        <Route path="/auth/callback" element={<CallbackPage />} />

        {/* Novel page without Layout (has its own theme toggle) */}
        <Route path="/novel/:id" element={<NovelPage />} />
        <Route
          path="/novel/:id/chapter/:chapterId/tts-review"
          element={<TtsReviewPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
