import { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-rose-50 p-6 text-center text-rose-900">
          <h1 className="mb-4 text-3xl font-black">Something went wrong 🐝</h1>
          <p className="mb-6 max-w-md text-lg font-medium">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="rounded-xl bg-rose-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-rose-700"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210",
);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {!PUBLISHABLE_KEY ? (
         <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 p-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-zinc-900">Configuration Error</h1>
            <p className="text-zinc-600">Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code> environment variable.</p>
         </div>
      ) : (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <App />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
)
