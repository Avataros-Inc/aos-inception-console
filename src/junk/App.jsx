// JUNK I PULLED OUT

// Home Page Component
const HomePage = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
        } else {
          setApiStatus({ status: 'unhealthy' });
        }
      } catch (error) {
        setApiStatus({ status: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="p-6 bg-background">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-accent-mint bg-clip-text text-transparent mb-2">
          Welcome to AvatarOS Console
        </h1>
        <p className="text-slate-400 text-lg">The future of AI-powered avatar creation and interaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl p-6 hover:border-accent-mint/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 flex flex-col">
          <div className="flex items-center mb-4">
            <Users className="mr-3 text-accent-mint" size={24} />
            <h3 className="text-xl font-semibold text-white">Avatar Creation</h3>
          </div>
          <p className="text-slate-400 mb-4 flex-grow">
            Create and customize lifelike 3D avatars with our advanced editor
          </p>
          <Link to="/console/characters">
            <button className="bg-accent-mint text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-accent-mint/25 transition-all duration-300">
              Get Started
            </button>
          </Link>
        </div>

        <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl p-6 hover:border-accent-mint/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 flex flex-col">
          <div className="flex items-center mb-4">
            <Mic className="mr-3 text-accent-mint" size={24} />
            <h3 className="text-xl font-semibold text-white">AI Generation</h3>
          </div>
          <p className="text-slate-400 mb-4 flex-grow">Transform text and audio into expressive avatar content</p>
          <Link to="/console/text-to-avatar">
            <button className="bg-accent-mint text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-accent-mint/25 transition-all duration-300">
              Explore Tools
            </button>
          </Link>
        </div>

        <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl p-6 hover:border-accent-mint/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 flex flex-col">
          <div className="flex items-center mb-4">
            <MessageSquare className="mr-3 text-accent-mint" size={24} />
            <h3 className="text-xl font-semibold text-white">Interactive Agents</h3>
          </div>
          <p className="text-slate-400 mb-4 flex-grow">Deploy conversational AI avatars across any platform</p>
          <Link to="/console/conversational-ai">
            <button className="bg-accent-mint text-slate-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-accent-mint/25 transition-all duration-300">
              Deploy Now
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl p-6">
        <div className="flex items-center mb-4">
          <MonitorPlay className="mr-3 text-accent-mint" size={24} />
          <h3 className="text-xl font-semibold text-white">System Status</h3>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-slate-400">API Endpoint: {API_BASE_URL}</span>
          </div>
          <div className="flex items-center">
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 text-accent-mint" size={16} />
                <span className="text-sm text-slate-400">Checking status...</span>
              </>
            ) : (
              <div className="flex items-center">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium mr-2 ${
                    apiStatus?.status === 'healthy' || apiStatus
                      ? 'bg-brand-500 text-brand-950'
                      : 'bg-red-500 text-red-900'
                  }`}
                >
                  {apiStatus?.status === 'healthy' || apiStatus ? 'Online' : 'Offline'}
                </div>
                <span className="text-sm text-slate-400">
                  {apiStatus?.status === 'error' ? apiStatus.message : 'System operational'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AlphaCard />
      </div>
    </div>
  );
};