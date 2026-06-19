import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CreateActivity from '@/pages/CreateActivity';
import ActivityDetail from '@/pages/ActivityDetail';
import AuthorCollaboration from '@/pages/AuthorCollaboration';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateActivity />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/author" element={<AuthorCollaboration />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}
