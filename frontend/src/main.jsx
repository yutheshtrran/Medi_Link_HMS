
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import AppContextProvider from './Context/AppContext.jsx'
import {Elements} from '@stripe/react-stripe-js'
import {loadStripe} from '@stripe/stripe-js'

const stripePromise = loadStripe('pk_test_51RDIreCk5O913mrad8ReqT9c6K97VrS3o21yNCuVYPBDPnuW9upT1ZknIXkkQxpY5fDwJVadNdELnJULEC90iaCM00KpUWdi0y');

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </AppContextProvider>
  </BrowserRouter>
)
