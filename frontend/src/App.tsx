import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routers';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0a0f1e', color: '#e2e8f0', border: '1px solid rgba(0,229,255,0.2)' },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
