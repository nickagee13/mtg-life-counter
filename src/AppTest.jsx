import React from 'react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#1a1a1a',
          color: 'white',
          minHeight: '100vh'
        }}>
          <h1>Something went wrong</h1>
          <pre style={{ color: 'red', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Test imports step by step
const TestMainApp = () => {
  const [testStep, setTestStep] = React.useState(0);
  const [error, setError] = React.useState(null);

  const tests = [
    {
      name: "Test Lucide Icons",
      test: async () => {
        const { ChevronRight } = await import('lucide-react');
        return <ChevronRight size={24} color="green" />;
      }
    },
    {
      name: "Test Supabase",
      test: async () => {
        const { supabase } = await import('./lib/supabase');
        return <span style={{color: 'green'}}>Supabase imported ✅</span>;
      }
    },
    {
      name: "Test Profile Context",
      test: async () => {
        const { ProfileProvider } = await import('./contexts/ProfileContext');
        return <span style={{color: 'green'}}>ProfileContext imported ✅</span>;
      }
    },
    {
      name: "Test Components",
      test: async () => {
        const GameCompleteScreen = await import('./components/GameCompleteScreen');
        const StatsScreen = await import('./components/StatsScreen');
        const ProfileManager = await import('./components/ProfileManager');
        return <span style={{color: 'green'}}>All components imported ✅</span>;
      }
    },
    {
      name: "Test CSS",
      test: async () => {
        await import('./App.css');
        return <span style={{color: 'green'}}>CSS imported ✅</span>;
      }
    }
  ];

  const runTest = async (index) => {
    try {
      setError(null);
      const result = await tests[index].test();
      setTestStep(index + 1);
      return result;
    } catch (err) {
      setError(`Error in ${tests[index].name}: ${err.message}`);
      console.error('Test error:', err);
    }
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1>MTG Life Counter - Import Debugging</h1>

      {error && (
        <div style={{
          backgroundColor: '#ff4444',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        {tests.map((test, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <button
              onClick={() => runTest(index)}
              style={{
                padding: '8px 16px',
                backgroundColor: testStep > index ? '#4CAF50' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {testStep > index ? '✅' : '▶️'} {test.name}
            </button>
            {testStep > index && <span style={{color: 'green'}}>Passed</span>}
          </div>
        ))}
      </div>

      {testStep >= tests.length && (
        <div style={{
          backgroundColor: '#4CAF50',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <strong>All imports working! The issue might be in App.jsx logic.</strong>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🔄 Test Simple App Version
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestMainApp;