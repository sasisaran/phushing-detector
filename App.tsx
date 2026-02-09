
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Shield, AlertCircle, Mail, Info, RefreshCcw, 
  AlertTriangle, Image as ImageIcon, X, History, ExternalLink, Search, Fingerprint, Lock, KeyRound, Activity,
  Zap, ToggleLeft, ToggleRight, Radio, QrCode, Globe, Layers, Eye, Loader2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { analyzePhishingContent } from './services/geminiService';
import { ScanState, ThreatLevel, AnalysisResult, HistoryItem } from './types';
import RiskMeter from './components/RiskMeter';
import ThreatRadar from './components/ThreatRadar';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [autoScanStatus, setAutoScanStatus] = useState<'idle' | 'typing' | 'waiting' | 'analyzing'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const [scan, setScan] = useState<ScanState>({
    isScanning: false,
    result: null,
    error: null,
  });

  const analysisSteps = [
    "Establishing Secure Handshake",
    "Fetching Global Reputation Data",
    "Running Visual Heuristic Engine",
    "Analyzing Adversarial Patterns",
    "Generating Threat Verdict"
  ];

  useEffect(() => {
    const saved = localStorage.getItem('phishguard_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedAutoScan = localStorage.getItem('phishguard_autoscan');
    if (savedAutoScan) setAutoScanEnabled(JSON.parse(savedAutoScan));
  }, []);

  useEffect(() => {
    localStorage.setItem('phishguard_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('phishguard_autoscan', JSON.stringify(autoScanEnabled));
  }, [autoScanEnabled]);

  const handleScan = useCallback(async (text: string, image: string | null) => {
    if (!text.trim() && !image) return;
    
    setScan(prev => ({ ...prev, isScanning: true, error: null }));
    setAutoScanStatus('analyzing');
    setScanProgress(0);
    setAnalysisStep(0);

    // Simulated progress increments for visual feedback
    const startTime = Date.now();
    const duration = 4000; // Estimated duration for UX
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 95), 95);
      setScanProgress(progress);
      setAnalysisStep(Math.floor((progress / 100) * analysisSteps.length));
    }, 100);

    try {
      const result = await analyzePhishingContent(text, image || undefined);
      clearInterval(interval);
      setScanProgress(100);
      setAnalysisStep(analysisSteps.length - 1);
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        inputSnippet: text.slice(0, 100) || "Image Analysis",
        inputType: text && image ? 'both' : image ? 'image' : 'text',
        result
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
      
      // Delay slightly for smooth completion animation
      setTimeout(() => {
        setScan({ isScanning: false, result, error: null });
        setAutoScanStatus('idle');
        setScanProgress(0);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setScan({ isScanning: false, result: null, error: err.message || 'An unexpected error occurred.' });
      setAutoScanStatus('idle');
      setScanProgress(0);
    }
  }, [history]);

  useEffect(() => {
    if (!autoScanEnabled || !inputValue.trim()) {
      setAutoScanStatus('idle');
      setScanProgress(0);
      return;
    }
    
    setAutoScanStatus('typing');
    setScanProgress(0);
    
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    if (progressIntervalRef.current) window.clearTimeout(progressIntervalRef.current);

    debounceTimerRef.current = window.setTimeout(() => {
      setAutoScanStatus('waiting');
      
      // Visual countdown progress for the trigger
      let currentWait = 0;
      const totalWait = 1500;
      const waitInterval = setInterval(() => {
        currentWait += 100;
        setScanProgress((currentWait / totalWait) * 100);
        if (currentWait >= totalWait) clearInterval(waitInterval);
      }, 100);

      debounceTimerRef.current = window.setTimeout(() => {
        clearInterval(waitInterval);
        if (!scan.isScanning) handleScan(inputValue, selectedImage);
      }, totalWait);
    }, 1000);

    return () => { 
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current); 
    };
  }, [inputValue, autoScanEnabled, handleScan, scan.isScanning, selectedImage]);

  const clearScan = () => {
    setInputValue('');
    setSelectedImage(null);
    setScan({ isScanning: false, result: null, error: null });
    setAutoScanStatus('idle');
    setScanProgress(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getSeverityStyles = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.LOW: return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
      case ThreatLevel.MEDIUM: return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
      case ThreatLevel.HIGH: return 'text-rose-400 bg-rose-950/30 border-rose-900/50';
      case ThreatLevel.CRITICAL: return 'text-red-500 bg-red-950/50 border-red-800/50';
      default: return 'text-blue-400 bg-blue-950/30 border-blue-900/50';
    }
  };

  const isUrlMode = inputValue.toLowerCase().startsWith('http') || inputValue.toLowerCase().startsWith('www');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                PHISHGUARD <span className="text-blue-500">PRO</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] -mt-1">Tier-1 Threat Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 no-print">
            <button 
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${autoScanEnabled ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              {autoScanEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-wider">Guardian</span>
            </button>

            <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg transition-colors">
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Global Progress Bar */}
        {scanProgress > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-300 ease-out`}
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* History Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-slate-950 border-r border-slate-900 z-[60] transform transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest">Security Vault</h2>
            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-900 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            {history.map(item => (
              <button key={item.id} onClick={() => { setScan({ isScanning: false, result: item.result, error: null }); setShowHistory(false); }} className="w-full text-left p-4 rounded-xl bg-[#020617] border border-slate-900 hover:border-blue-500/50 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${getSeverityStyles(item.result.threatLevel)}`}>{item.result.threatLevel}</span>
                  <span className="text-[8px] text-slate-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">RESTORE</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 font-mono">{item.inputSnippet}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6 no-print">
            <section className={`bg-slate-900/20 border rounded-3xl p-8 shadow-2xl transition-all duration-500 ${autoScanStatus === 'waiting' ? 'border-blue-500/50 bg-blue-500/[0.02]' : 'border-slate-800/40'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${autoScanEnabled ? 'bg-blue-500/20' : 'bg-slate-800/50'}`}>
                    {autoScanEnabled ? <Zap className="w-5 h-5 text-blue-400 animate-pulse" /> : <Activity className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                      Advanced Inspector
                      {autoScanEnabled && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full animate-bounce">LIVE</span>}
                    </h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase">
                      {autoScanStatus === 'waiting' ? 'Auto-Scan Initializing...' : autoScanStatus === 'typing' ? 'Analyzing keystrokes...' : 'Deep Forensic Analysis Mode'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {autoScanStatus !== 'idle' && (
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${scanProgress}%` }} />
                      </div>
                      <Radio className={`w-4 h-4 ${autoScanStatus === 'waiting' ? 'text-blue-500 animate-ping' : 'text-slate-700'}`} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="relative">
                  <textarea
                    className="w-full h-72 bg-[#010413] border border-slate-800 rounded-2xl p-6 text-sm mono focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-800 resize-none shadow-2xl"
                    placeholder="Analyze URLs, email headers, or page source..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={scan.isScanning}
                  />
                  {autoScanEnabled && !inputValue && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <div className="flex flex-col items-center gap-3">
                         <Activity className="w-12 h-12 text-blue-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Guardian Monitoring Active</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedImage && (
                  <div className="relative w-32 h-32 mb-4 animate-in fade-in zoom-in-95">
                    <img src={selectedImage} alt="Thumbnail" className="w-full h-full object-cover rounded-xl border-2 border-blue-500 shadow-2xl" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-[#010413] border border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all group">
                    <ImageIcon className="w-4 h-4 mx-auto group-hover:scale-125 transition-transform" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <button
                    onClick={() => handleScan(inputValue, selectedImage)}
                    disabled={scan.isScanning || (!inputValue.trim() && !selectedImage)}
                    className={`flex-[4] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white transition-all shadow-xl ${scan.isScanning ? 'bg-slate-800 shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-95'}`}
                  >
                    {scan.isScanning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Decoding Payloads...
                      </span>
                    ) : 'Initiate Forensic Scan'}
                  </button>
                </div>
              </div>
            </section>

            {!scan.result && !scan.isScanning && (
              <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <AttackBadge icon={<QrCode className="w-4 h-4" />} label="Quishing" />
                <AttackBadge icon={<Layers className="w-4 h-4" />} label="BitB Proxy" />
                <AttackBadge icon={<Eye className="w-4 h-4" />} label="AiTM Shield" />
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            {scan.result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                <section className="bg-slate-900/30 border border-slate-800/40 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                  <div className={`px-8 py-4 flex justify-between items-center border-b ${getSeverityStyles(scan.result.threatLevel)}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Threat Intelligence Result</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div className="bg-[#010413]/50 border border-slate-900 rounded-2xl p-4">
                      <ThreatRadar data={scan.result.threatBreakdown} level={scan.result.threatLevel} />
                    </div>

                    <RiskMeter score={scan.result.riskScore} level={scan.result.threatLevel} />

                    {/* Advanced Forensic Layer */}
                    <div className="space-y-4">
                      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-3 h-3 text-blue-400" />
                        Elite Attack Vectors
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <ForensicResult icon={<QrCode />} label="Quishing" active={scan.result.advancedForensics.quishingDetected} />
                        <ForensicResult icon={<Globe />} label="AiTM Proxy" active={scan.result.advancedForensics.aitmProxySuspected} />
                        <ForensicResult icon={<Layers />} label="BitB UI" active={scan.result.advancedForensics.bitbFakeUIDetected} />
                        <div className="bg-[#010413] p-3 rounded-xl border border-slate-900">
                           <span className="text-[8px] text-slate-600 block uppercase mb-1">Obfuscation</span>
                           <span className="text-[9px] font-black uppercase text-blue-400 truncate">{scan.result.advancedForensics.obfuscationTechnique || 'None Detected'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Forensic Summary</h3>
                      <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 font-medium">
                        {scan.result.summary}
                      </p>
                    </div>

                    {scan.result.sources && (
                      <div className="space-y-3 pt-4 border-t border-slate-800/50">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Verified Intelligence</h3>
                        {scan.result.sources.map((s, i) => (
                          <a key={i} href={s.uri} target="_blank" className="flex items-center justify-between px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-500/10 transition-all group">
                            <span className="text-[10px] text-blue-400 font-bold truncate pr-4">{s.title}</span>
                            <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
                <button onClick={clearScan} className="w-full py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white hover:bg-slate-900 transition-all">Reset Scan Core</button>
              </div>
            ) : scan.isScanning ? (
              <div className="h-full bg-slate-900/10 border border-slate-900/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-slate-800 border-b-blue-500 rounded-full animate-spin"></div>
                  <Shield className="w-12 h-12 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                
                <div className="space-y-6 w-full max-w-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Analysis Pipeline Active</p>
                    <p className="text-xs font-black text-white">{analysisSteps[analysisStep]}</p>
                  </div>

                  <div className="space-y-3">
                    {analysisSteps.map((step, idx) => (
                      <div key={idx} className={`flex items-center gap-3 text-[10px] font-bold transition-opacity duration-300 ${idx === analysisStep ? 'text-blue-400' : idx < analysisStep ? 'text-emerald-500' : 'text-slate-700'}`}>
                        {idx < analysisStep ? <CheckCircle2 className="w-3 h-3" /> : idx === analysisStep ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-3 h-3 rounded-full border border-slate-800" />}
                        <span className="truncate">{step}</span>
                        {idx === analysisStep && <ChevronRight className="w-3 h-3 animate-pulse ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-900 rounded-3xl flex flex-col items-center justify-center p-16 text-center opacity-20 grayscale">
                <div className="relative mb-6">
                  <Layers className="w-16 h-16 text-slate-600" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Forensic Core Offline</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Waiting for input stream...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-900/50 no-print">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-slate-700">
           <span>PhishGuard PRO v3.2</span>
           <div className="flex gap-6">
             <span>Elite Threat Intel</span>
             <span>© 2025 Secure Systems</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

const AttackBadge: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 opacity-60 hover:opacity-100 hover:border-blue-500/30 transition-all group">
    <div className="text-blue-400 group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">{label}</span>
  </div>
);

const ForensicResult: React.FC<{ icon: React.ReactNode, label: string, active: boolean }> = ({ icon, label, active }) => (
  <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${active ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'}`}>
    <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
    <div className="flex flex-col">
      <span className="text-[8px] uppercase font-black opacity-60 leading-none mb-1">{label}</span>
      <span className="text-[9px] font-black uppercase leading-tight">{active ? 'Detected' : 'Clean'}</span>
    </div>
    {active && <AlertCircle className="w-3 h-3 ml-auto animate-pulse" />}
  </div>
);

export default App;
