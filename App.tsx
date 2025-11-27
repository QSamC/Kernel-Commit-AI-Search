import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, FileText, Upload, Cpu, AlertCircle, Loader2, Github, LayoutGrid, Sparkles, Settings, Key, X } from 'lucide-react';
import { CommitAnalysis, AppState, DataSource } from './types';
import { analyzeCommits, extractSearchTerms } from './services/geminiService';
import { searchLinuxKernelCommits } from './services/githubService';
import { SAMPLE_GIT_LOG } from './constants';
import CommitCard from './components/CommitCard';

const App: React.FC = () => {
  const [logContent, setLogContent] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<CommitAnalysis[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [dataSource, setDataSource] = useState<DataSource>(DataSource.GITHUB);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optimizedKeywords, setOptimizedKeywords] = useState<string>('');
  
  // API Key Management
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to safely get the API Key from various sources
  const getEffectiveApiKey = useCallback(() => {
    if (userApiKey) return userApiKey;
    
    // Try standard Vite env var
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    
    // Try Create React App / Standard Node env var
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env.API_KEY) {
       // @ts-ignore
       return process.env.API_KEY;
    }
    
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env.REACT_APP_API_KEY) {
       // @ts-ignore
       return process.env.REACT_APP_API_KEY;
    }

    return '';
  }, [userApiKey]);

  const handleSaveKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setLogContent(content);
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  const useSampleData = () => {
    setLogContent(SAMPLE_GIT_LOG);
    setQuery("Fix race conditions in networking or scheduler");
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setErrorMsg("Please enter a search query.");
      return;
    }
    
    if (dataSource === DataSource.LOCAL_FILE && !logContent.trim()) {
      setErrorMsg("Please upload a git log file or use sample data first.");
      return;
    }

    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
      setShowSettings(true);
      setErrorMsg("API Key is required to proceed. Please enter it in Settings.");
      return;
    }

    setErrorMsg(null);
    setResults([]);
    setOptimizedKeywords('');

    try {
      let contextToAnalyze = logContent;

      // STEP 1: If using GitHub, fetch candidates first
      if (dataSource === DataSource.GITHUB) {
        setAppState(AppState.FETCHING_GITHUB);
        try {
          const keywords = await extractSearchTerms(query, apiKey);
          setOptimizedKeywords(keywords);

          const githubData = await searchLinuxKernelCommits(keywords);
          if (!githubData) {
            throw new Error(`No matching commits found for keywords: "${keywords}". Try being more specific.`);
          }
          contextToAnalyze = githubData;
        } catch (ghError) {
          throw new Error(ghError instanceof Error ? ghError.message : "Failed to fetch from GitHub.");
        }
      }

      // STEP 2: Analyze with Gemini
      setAppState(AppState.ANALYZING);
      const analyses = await analyzeCommits(query, contextToAnalyze, apiKey);
      setResults(analyses);
      setAppState(AppState.RESULTS);

    } catch (err) {
      setAppState(AppState.ERROR);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred during analysis.");
    }
  }, [query, logContent, dataSource, getEffectiveApiKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text p-6 font-sans relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 border-b border-terminal-border pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-terminal-accent p-2 rounded-lg">
                  <Cpu size={24} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">KernelCommit AI Search</h1>
              </div>
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                Semantic RAG Search for <strong>torvalds/linux</strong>. 
                Powered by <span className="text-terminal-highlight">Gemini 3.0 Pro</span>.
              </p>
            </div>
            
            <button 
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${getEffectiveApiKey() ? 'border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/40' : 'border-red-800 bg-red-900/20 text-red-400 hover:bg-red-900/40'}`}
            >
               <Settings size={12} />
               {getEffectiveApiKey() ? 'API Key Configured' : 'Set API Key'}
            </button>
          </div>
        </header>

        {/* API Key Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-terminal-card border border-terminal-border rounded-xl p-6 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Key size={18} className="text-terminal-highlight" />
                Configure API Key
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  To use Gemini 3.0 Pro, you need a valid Google GenAI API Key. 
                  Your key is stored locally in your browser and sent directly to Google.
                </p>
                
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Your API Key</label>
                  <input 
                    type="password" 
                    value={userApiKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#0D1117] border border-terminal-border rounded-md p-3 text-sm text-white focus:outline-none focus:border-terminal-highlight font-mono"
                  />
                </div>

                <div className="bg-[#0f1218] p-3 rounded border border-terminal-border text-xs text-gray-500">
                  Tip: If you deploy this app, you can also set <code className="text-terminal-highlight">VITE_API_KEY</code> in your environment variables to avoid entering this manually.
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-terminal-highlight hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Source Toggle */}
        <div className="flex gap-4 mb-6">
           <button 
             onClick={() => { setDataSource(DataSource.GITHUB); setErrorMsg(null); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${dataSource === DataSource.GITHUB ? 'bg-terminal-highlight text-white shadow-lg shadow-blue-900/20' : 'bg-terminal-card border border-terminal-border text-gray-400 hover:text-white'}`}
           >
             <Github size={16} /> GitHub Repo (Live)
           </button>
           <button 
             onClick={() => { setDataSource(DataSource.LOCAL_FILE); setErrorMsg(null); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${dataSource === DataSource.LOCAL_FILE ? 'bg-terminal-highlight text-white shadow-lg shadow-blue-900/20' : 'bg-terminal-card border border-terminal-border text-gray-400 hover:text-white'}`}
           >
             <FileText size={16} /> Upload Log (Local)
           </button>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Left Panel: Configuration based on Source */}
          <div className="col-span-1 md:col-span-1">
            <div className="bg-terminal-card border border-terminal-border rounded-lg p-5 h-full flex flex-col transition-all">
              {dataSource === DataSource.GITHUB ? (
                 <>
                   <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                     <LayoutGrid size={16} /> Repository
                   </h2>
                   <div className="text-sm text-gray-400 mb-4">
                     Targeting: <br/>
                     <span className="text-white font-mono bg-[#0f1218] px-2 py-1 rounded border border-terminal-border mt-1 inline-block">
                       torvalds/linux
                     </span>
                   </div>
                   <div className="mt-auto text-xs text-gray-500 border-t border-terminal-border pt-3">
                     Fetches candidates via GitHub API, then uses Gemini to analyze relevance.
                   </div>
                 </>
              ) : (
                <>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={16} /> Local Source
                  </h2>
                  <div className="flex-1 flex flex-col gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".txt,.log" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-terminal-border rounded-md transition-colors text-sm"
                    >
                      <Upload size={14} /> Upload Git Log
                    </button>
                    
                    <button 
                      onClick={useSampleData}
                      className="w-full py-2 px-4 bg-transparent border border-terminal-border hover:border-terminal-highlight text-gray-300 hover:text-white rounded-md transition-all text-sm"
                    >
                      Load Sample Data
                    </button>

                    {logContent && (
                      <div className="mt-auto pt-4 text-xs font-mono text-green-400 truncate">
                        ✓ Loaded ({logContent.length} chars)
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Query Area */}
          <div className="col-span-1 md:col-span-2">
            <div className="bg-terminal-card border border-terminal-border rounded-lg p-5 h-full flex flex-col">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search size={16} /> 
                {dataSource === DataSource.GITHUB ? "Natural Language Search" : "Semantic Query"}
              </h2>
              
              <div className="flex-1 flex flex-col relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={dataSource === DataSource.GITHUB 
                    ? "e.g., 'Fix memory leak in eBPF verifier' or 'Changes to scheduler load balancing 2023'"
                    : "e.g., 'Find the commit that fixed the use-after-free bug'"}
                  className="w-full h-full bg-[#0D1117] border border-terminal-border rounded-md p-3 text-sm text-white focus:outline-none focus:border-terminal-highlight focus:ring-1 focus:ring-terminal-highlight resize-none font-mono"
                />
                <button
                  onClick={handleSearch}
                  disabled={appState === AppState.ANALYZING || appState === AppState.FETCHING_GITHUB}
                  className="absolute bottom-3 right-3 bg-terminal-accent hover:bg-[#2ea043] text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {appState === AppState.FETCHING_GITHUB ? (
                    <>
                       <Loader2 size={16} className="animate-spin" /> Optimizing & Fetching...
                    </>
                  ) : appState === AppState.ANALYZING ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Gemini Thinking...
                    </>
                  ) : (
                    <>Analyze Commits</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optimizing Hint */}
        {optimizedKeywords && dataSource === DataSource.GITHUB && appState === AppState.RESULTS && (
          <div className="mb-6 bg-terminal-card border border-terminal-border rounded-lg p-3 flex items-center gap-3 text-sm text-gray-400 animate-fadeIn">
            <Sparkles size={16} className="text-terminal-highlight" />
            <span>
              Optimized query for GitHub: <span className="font-mono text-white bg-[#0f1218] px-2 py-0.5 rounded">{optimizedKeywords}</span>
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Results Section */}
        {appState === AppState.RESULTS && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-terminal-highlight">Top {results.length}</span> Relevant Commits
            </h2>
            <div className="space-y-4">
              {results.length > 0 ? (
                results.map((commit, index) => (
                  <CommitCard key={index} commit={commit} rank={index + 1} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 border border-dashed border-terminal-border rounded-lg">
                  No matching commits found for your criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {(appState === AppState.ANALYZING || appState === AppState.FETCHING_GITHUB) && (
          <div className="space-y-4 animate-pulse">
            <div className="text-center text-gray-500 text-sm mb-2 font-mono">
               {appState === AppState.FETCHING_GITHUB ? "Scanning repository with optimized keywords..." : "Reading commits & generating reasoning..."}
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-terminal-card border border-terminal-border rounded-lg p-5 h-40 opacity-50">
                <div className="h-4 bg-terminal-border rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-terminal-border rounded w-1/4 mb-6"></div>
                <div className="h-20 bg-[#0f1218] rounded border-l-2 border-terminal-border"></div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default App;