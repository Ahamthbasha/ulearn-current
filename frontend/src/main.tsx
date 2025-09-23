// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store.tsx'
import SocketProvider from './redux/SocketProvider.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Provider store={store}>
      <SocketProvider>   
    <BrowserRouter>
    <App />
    </BrowserRouter>
      </SocketProvider>
    </Provider>
  // </StrictMode>,
)
