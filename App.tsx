import React, { useState } from 'react';
import { BrandIdentity, ViewState } from './types';
import { generateBrandStrategy, generateLogo, editBrandImage, animateBrandAsset } from './services/geminiService';

// Icons
const MagicIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>;
const PhotoIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const VideoIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>;
const BackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>;
const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.INPUT);
  const [mission, setMission] = useState('');
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Edit/Animate State
  const [currentImage, setCurrentImage] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');

  // 1. Main Generation Flow
  const handleGenerateBrand = async () => {
    if (!mission.trim()) return;
    setViewState(ViewState.LOADING);
    setLoadingMessage("Analizando misión y diseñando estrategia...");

    try {
      // Step 1: Text Strategy
      const strategy = await generateBrandStrategy(mission);
      setLoadingMessage(`Generando logotipo para "${strategy.companyName}"...`);
      
      // Step 2: Image Generation
      const logoUrl = await generateLogo(strategy.logoPrompt);

      setBrandData({ ...strategy, logoUrl });
      setCurrentImage(logoUrl);
      setViewState(ViewState.DASHBOARD);
    } catch (error) {
      console.error(error);
      alert("Error generando la marca. Inténtalo de nuevo.");
      setViewState(ViewState.INPUT);
    }
  };

  // 2. Image Editing Flow (Nano Banana)
  const handleEditImage = async () => {
    if (!editPrompt.trim()) return;
    setLoadingMessage("Editando imagen con Gemini Flash Image...");
    const prevState = viewState;
    setViewState(ViewState.LOADING);

    try {
      const newImageUrl = await editBrandImage(currentImage, editPrompt);
      setCurrentImage(newImageUrl);
      setViewState(ViewState.EDIT_IMAGE);
      setEditPrompt('');
    } catch (error) {
      console.error(error);
      alert("Error editando imagen.");
      setViewState(prevState);
    }
  };

  // 3. Video Animation Flow (Veo)
  const handleAnimateImage = async () => {
    setLoadingMessage("Generando video con Veo (esto puede tardar unos minutos)...");
    const prevState = viewState;
    setViewState(ViewState.LOADING);

    try {
      const url = await animateBrandAsset(currentImage);
      setVideoUrl(url);
      setViewState(ViewState.ANIMATE_VIDEO);
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_MISSING" && window.aistudio?.openSelectKey) {
         await window.aistudio.openSelectKey();
         // Retry logic could go here, but for now lets return to dashboard to let user click again
         alert("Por favor selecciona una API Key para usar Veo.");
      } else {
         alert("Error generando video. Asegúrate de tener una API Key seleccionada.");
      }
      setViewState(prevState);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        // If we are in dashboard, maybe switch to edit mode? 
        // Let's stay in current mode but update the reference image
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Views ---

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
      <p className="text-xl text-slate-600 font-medium text-center px-4 animate-pulse">{loadingMessage}</p>
    </div>
  );

  const renderInput = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 border border-slate-100">
        <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6 mx-auto text-indigo-600">
          <MagicIcon />
        </div>
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-2">BrandGenesis AI</h1>
        <p className="text-center text-slate-500 mb-8">
          Describe tu misión y deja que nuestra IA construya tu "Biblia de Marca" completa: Logo, colores, fuentes y más.
        </p>
        
        <textarea
          className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-lg mb-6 transition-all"
          placeholder="Ej: Una cafetería ecológica en Bogotá que vende café de especialidad y apoya a agricultores locales..."
          value={mission}
          onChange={(e) => setMission(e.target.value)}
        />
        
        <button
          onClick={handleGenerateBrand}
          disabled={!mission.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MagicIcon /> Generar Identidad
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!brandData) return null;

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{brandData.companyName}</h2>
            <p className="text-sm text-slate-500">{brandData.tagline}</p>
          </div>
          <button onClick={() => setViewState(ViewState.INPUT)} className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
            <BackIcon /> Nueva Marca
          </button>
        </header>

        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          
          {/* Left Col: Visual Assets */}
          <div className="lg:col-span-5 space-y-8">
            {/* Logo Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Logotipo Principal</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setCurrentImage(brandData.logoUrl || ''); setViewState(ViewState.EDIT_IMAGE); }} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600" title="Editar con IA">
                    <EditIcon />
                  </button>
                  <button onClick={() => { setCurrentImage(brandData.logoUrl || ''); handleAnimateImage(); }} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600" title="Animar Logo">
                    <VideoIcon />
                  </button>
                </div>
              </div>
              <div className="aspect-square bg-slate-100 flex items-center justify-center relative group">
                 {currentImage ? (
                   <img src={currentImage} alt="Logo" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-slate-400">Imagen no disponible</div>
                 )}
              </div>
              <div className="p-4 bg-slate-50">
                 <p className="text-xs text-slate-500 font-mono leading-tight line-clamp-3" title={brandData.logoPrompt}>
                    PROMPT: {brandData.logoPrompt}
                 </p>
              </div>
            </div>

            {/* Palette */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-700 mb-4">Paleta Cromática</h3>
              <div className="space-y-3">
                {brandData.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-xl shadow-sm ring-1 ring-black/5" style={{ backgroundColor: c.hex }}></div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.hex}</p>
                    </div>
                    <p className="text-xs text-slate-400 italic text-right w-24">{c.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Strategy & Typography */}
          <div className="lg:col-span-7 space-y-8">
            {/* Mission */}
            <div className="bg-indigo-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
              <h3 className="text-indigo-100 font-semibold mb-2 tracking-wide uppercase text-sm">Misión de la Marca</h3>
              <p className="text-2xl font-serif leading-relaxed">"{brandData.missionStatement}"</p>
            </div>

            {/* Typography */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-slate-700 mb-6">Tipografía</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {brandData.fonts.map((f, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="mb-3 border-b border-slate-200 pb-2">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opción {i + 1}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                        <p className="text-3xl text-slate-900" style={{ fontFamily: f.header.split(':')[0] }}>Aa Bb Cc</p>
                        <p className="text-sm text-slate-500">Header: {f.header}</p>
                        <p className="text-base text-slate-700 leading-relaxed" style={{ fontFamily: f.body.split(':')[0] }}>
                          El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña tocaba el saxofón detrás del palenque de paja.
                        </p>
                        <p className="text-sm text-slate-500">Body: {f.body}</p>
                    </div>
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                       "{f.reasoning}"
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                 <a href="https://fonts.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">Explorar Google Fonts &rarr;</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
         <h2 className="text-xl font-bold flex items-center gap-2"><EditIcon /> Editor IA (Gemini 2.5 Flash Image)</h2>
         <button onClick={() => setViewState(ViewState.DASHBOARD)} className="text-slate-400 hover:text-white">Cerrar</button>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row">
         <div className="flex-1 bg-black/50 flex items-center justify-center p-8 relative">
            <img src={currentImage} alt="To Edit" className="max-h-[70vh] max-w-full rounded shadow-2xl" />
         </div>
         
         <div className="w-full lg:w-96 bg-slate-800 p-6 flex flex-col gap-6">
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Subir nueva referencia (Opcional)</label>
               <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"/>
            </div>

            <div className="flex-1">
               <label className="block text-sm font-medium text-slate-400 mb-2">¿Qué quieres cambiar?</label>
               <textarea 
                 className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="Ej: Añade un filtro retro, elimina el fondo, cambia el color a rojo..."
                 value={editPrompt}
                 onChange={(e) => setEditPrompt(e.target.value)}
               />
               <p className="text-xs text-slate-500 mt-2">Powered by Nano Banana (Flash Image)</p>
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={handleEditImage}
                 disabled={!editPrompt}
                 className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold transition-colors"
               >
                 Generar Edición
               </button>
               
               <button 
                 onClick={handleAnimateImage}
                 className="flex-1 bg-pink-600 hover:bg-pink-500 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
               >
                  <VideoIcon /> Animar (Veo)
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  const renderVideoResult = () => (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
       <div className="max-w-4xl w-full">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">Veo 3.1 Animation</h2>
             <button onClick={() => setViewState(ViewState.DASHBOARD)} className="text-white hover:underline flex items-center gap-2"><BackIcon /> Volver al Dashboard</button>
          </div>
          
          <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative">
             {videoUrl ? (
               <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
             ) : (
               <div className="flex items-center justify-center h-full text-slate-500">Error al cargar video</div>
             )}
          </div>
          
          <div className="mt-6 text-center">
             <a href={videoUrl} download="brand-animation.mp4" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors">
                Descargar MP4
             </a>
          </div>
       </div>
    </div>
  );

  return (
    <div className="font-sans text-slate-900">
      {viewState === ViewState.INPUT && renderInput()}
      {viewState === ViewState.LOADING && renderLoading()}
      {viewState === ViewState.DASHBOARD && renderDashboard()}
      {viewState === ViewState.EDIT_IMAGE && renderEditor()}
      {viewState === ViewState.ANIMATE_VIDEO && renderVideoResult()}
    </div>
  );
};

export default App;