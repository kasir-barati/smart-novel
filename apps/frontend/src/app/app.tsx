import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { HomePage } from '../pages/home/HomePage';
import { NovelPage } from '../pages/novel/NovelPage';
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

        {/* Novel page without Layout (has its own theme toggle) */}
        <Route path="/novel/:id" element={<NovelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
