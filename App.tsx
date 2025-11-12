
import React, { useState, useCallback } from 'react';
import Uploader from './components/Uploader';
import AspectRatioSelector from './components/AspectRatioSelector';
import { generate8KDescription } from './services/geminiService';
import { GenerationResult, AspectRatio, ImageFile } from './types';
import { copyToClipboard } from './utils/fileUtils';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(AspectRatio.RATIO_16_9);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [specsExpanded, setSpecsExpanded] = useState<boolean>(false);

  const handleImageSelected = useCallback((imageFile: ImageFile | null) => {
    setSelectedImage(imageFile);
    setResult(null); // Clear previous results on new image selection
    setErrorMessage(null); // Clear errors
    setCopyFeedback(false);
  }, []);

  const handleGenerateDescription = async () => {
    if (!selectedImage) {
      setErrorMessage('Por favor, selecione uma imagem primeiro.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setCopyFeedback(false);

    try {
      const response = await generate8KDescription(
        selectedImage.base64,
        selectedImage.file.type,
        selectedAspectRatio,
      );
      setResult(response);
    } catch (error) {
      console.error('Erro na geração da descrição:', error);
      let msg = 'Ocorreu um erro ao gerar a descrição.';
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          msg = 'Erro na requisição. Verifique o formato da imagem ou tente novamente.';
        } else if (error.message.includes('429')) {
          msg = 'Muitas requisições. Por favor, espere um pouco e tente novamente.';
        } else if (error.message.includes('500')) {
          msg = 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
        } else if (error.message.includes('API_KEY não está configurada')) {
          msg = 'Chave de API não configurada. Verifique suas variáveis de ambiente.';
        } else {
          msg = error.message;
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDescription = async () => {
    if (result?.description8K) {
      const success = await copyToClipboard(result.description8K);
      if (success) {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000); // Hide feedback after 2 seconds
      } else {
        setErrorMessage('Não foi possível copiar para a área de transferência. Tente manualmente.');
      }
    }
  };

  const handleNewUpload = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMessage(null);
    setCopyFeedback(false);
    setSpecsExpanded(false);
  };

  const handleDescriptionTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.select();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-2">
          Descritor 8K
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          Arraste uma imagem e gere um prompt fiel para re-render 8K.
        </p>
      </header>

      <main className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8">
        <div className="mb-6">
          <Uploader
            onImageSelected={handleImageSelected}
            selectedImage={selectedImage}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </div>

        {selectedImage && (
          <div className="mb-6">
            <AspectRatioSelector
              selectedRatio={selectedAspectRatio}
              onRatioChange={setSelectedAspectRatio}
            />
          </div>
        )}

        <div className="flex justify-center mb-6">
          <button
            onClick={handleGenerateDescription}
            disabled={!selectedImage || isLoading}
            className={`
              flex items-center justify-center px-6 py-3 text-lg font-semibold rounded-md transition-all duration-300
              ${!selectedImage || isLoading
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md'
              }
            `}
            aria-live="polite"
            aria-disabled={!selectedImage || isLoading}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Analisando imagem...' : 'Gerar descrição 8K'}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-center" role="alert">
            {errorMessage}
          </div>
        )}

        {result && (
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
            <h3 className="text-xl font-semibold mb-3 text-indigo-700 dark:text-indigo-400">Descrição 8K</h3>
            <textarea
              readOnly
              value={result.description8K}
              onFocus={handleDescriptionTextareaFocus}
              className="w-full h-48 p-3 mb-4 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200"
              aria-label="Descrição 8K gerada"
            ></textarea>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleCopyDescription}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-md shadow-sm transition-colors duration-200"
                aria-label="Copiar descrição para área de transferência"
                title="Copiar para área de transferência"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-4 10v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m-2 2h2m-2 0h2" />
                </svg>
                {copyFeedback ? 'Copiado!' : 'Copiar descrição'}
              </button>
              <a
                href="#"
                onClick={handleNewUpload}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium transition-colors duration-200"
                aria-label="Carregar outra imagem"
              >
                Carregar outra imagem
              </a>
            </div>

            <div className="mt-6 border-t border-gray-300 dark:border-gray-600 pt-6">
              <button
                onClick={() => setSpecsExpanded(!specsExpanded)}
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-expanded={specsExpanded}
                aria-controls="technical-specs"
              >
                <span>Especificações técnicas sugeridas (opcional)</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ${specsExpanded ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {specsExpanded && (
                <ul id="technical-specs" className="mt-4 text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-2">
                  {result.suggestedTechnicalSpecs.map((spec, index) => (
                    <li key={index}>{spec}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
