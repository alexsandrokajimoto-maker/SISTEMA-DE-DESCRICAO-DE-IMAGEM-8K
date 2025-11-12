
import React, { useState, useRef } from 'react';
import { ImageFile } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

interface UploaderProps {
  onImageSelected: (imageFile: ImageFile | null) => void;
  selectedImage: ImageFile | null;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string[];
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
}

const Uploader: React.FC<UploaderProps> = ({
  onImageSelected,
  selectedImage,
  maxFileSizeMB = 25,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  errorMessage,
  setErrorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    setErrorMessage(null); // Clear previous errors
    if (!file) {
      onImageSelected(null);
      return;
    }

    if (!acceptedFileTypes.includes(file.type)) {
      setErrorMessage(`Formato não suportado. Use JPG, PNG ou WebP.`);
      onImageSelected(null);
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`Arquivo muito grande. Máximo ${maxFileSizeMB} MB.`);
      onImageSelected(null);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      onImageSelected({ file, base64, url: URL.createObjectURL(file) });
    } catch (error) {
      console.error('Erro ao ler o arquivo:', error);
      setErrorMessage('Não consegui ler a imagem. Tente outra vez.');
      onImageSelected(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSelectButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    onImageSelected(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  };

  return (
    <div className="w-full">
      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectButtonClick}
          className={`
            flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer
            ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}
            hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-200
          `}
          aria-live="polite"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={acceptedFileTypes.join(',')}
            className="hidden"
            aria-label="Selecionar arquivo de imagem"
          />
          <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            <span className="font-semibold">Solte a imagem aqui</span> ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            JPG, PNG ou WebP (máx. {maxFileSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm">
          <img
            src={selectedImage.url}
            alt="Miniatura da imagem selecionada"
            className="max-w-full h-40 object-contain rounded-md mb-3 border border-gray-200 dark:border-gray-600"
          />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 truncate max-w-full">
            {selectedImage.file.name}
          </p>
          <button
            onClick={handleRemoveImage}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm font-medium transition-colors"
            aria-label="Remover imagem"
          >
            Remover imagem
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Uploader;
