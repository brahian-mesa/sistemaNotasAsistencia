import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlassIcon, MagnifyingGlassMinusIcon, DocumentArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import calendarioPdf from '../assets/Resoluciones cronograma 2025 v1.pdf'
import db from '../utils/database'

export default function CalendarioEscolar() {
  const [showPdfViewer, setShowPdfViewer] = useState(true) // Mostrar PDF por defecto
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Estados para carga de PDF personalizado
  const [pdfPersonalizado, setPdfPersonalizado] = useState(null)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const pdfContainerRef = useRef(null)
  const pdfViewerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Cargar PDF personalizado al iniciar
  useEffect(() => {
    const cargarPdfPersonalizado = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Cargando PDF personalizado desde Supabase...');
        
        const pdfData = await db.getCalendarioEscolarPdf();
        if (pdfData && pdfData.datos_archivo) {
          // Convertir base64 a blob
          const byteCharacters = atob(pdfData.datos_archivo);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          setPdfPersonalizado(url);
          setNombreArchivo(pdfData.nombre_archivo);
          console.log('✅ PDF personalizado cargado:', pdfData.nombre_archivo);
        } else {
          console.log('📝 No hay PDF personalizado guardado');
        }
      } catch (error) {
        console.error('❌ Error cargando PDF personalizado:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarPdfPersonalizado();
  }, []);

  const togglePdfViewer = () => {
    setShowPdfViewer(!showPdfViewer)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const resetView = () => {
    setScale(1.0)
    setPosition({ x: 0, y: 0 })
  }

  const centerPdf = () => {
    setPosition({ x: 0, y: 0 })
  }

  // Función para manejar la carga de archivo PDF
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      setUploadStatus('❌ Solo se permiten archivos PDF');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('❌ El archivo es demasiado grande (máximo 10MB)');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('🔄 Cargando archivo...');

      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1]; // Remover el prefijo data:application/pdf;base64,
          
          // Guardar en la base de datos
          await db.guardarCalendarioEscolarPdf(base64Data, file.name);
          
          // Crear URL para mostrar el PDF
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          // Actualizar estado
          setPdfPersonalizado(url);
          setNombreArchivo(file.name);
          setShowUploadModal(false);
          setUploadStatus('✅ PDF cargado correctamente');
          
          console.log('✅ PDF cargado y guardado:', file.name);
          
          setTimeout(() => setUploadStatus(''), 3000);
        } catch (error) {
          console.error('❌ Error procesando archivo:', error);
          setUploadStatus(`❌ Error al procesar: ${error.message}`);
          setTimeout(() => setUploadStatus(''), 5000);
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error cargando archivo:', error);
      setUploadStatus(`❌ Error al cargar: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
      setIsUploading(false);
    }
  };

  // Función para eliminar PDF personalizado
  const eliminarPdfPersonalizado = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar el PDF personalizado?')) {
      try {
        setIsUploading(true);
        setUploadStatus('🔄 Eliminando PDF...');
        
        // Eliminar de la base de datos
        await db.eliminarCalendarioEscolarPdf();
        
        // Limpiar estado local
        setPdfPersonalizado(null);
        setNombreArchivo('');
        
        setUploadStatus('✅ PDF eliminado');
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        console.error('❌ Error eliminando PDF:', error);
        setUploadStatus(`❌ Error al eliminar: ${error.message}`);
        setTimeout(() => setUploadStatus(''), 5000);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Determinar qué PDF mostrar
  const pdfToShow = pdfPersonalizado || calendarioPdf;
  const pdfTitle = pdfPersonalizado ? nombreArchivo : "Calendario Escolar 2025";

  return (
    <PageContainer>
      <div className="h-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/40 flex flex-col">
        {/* Header */}
        <div className="bg-white/95 border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Calendario Escolar 2025</h1>
            {nombreArchivo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DocumentIcon className="w-4 h-4" />
                <span>{nombreArchivo}</span>
                <button
                  onClick={eliminarPdfPersonalizado}
                  className="text-red-500 hover:text-red-700"
                  title="Eliminar PDF personalizado"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Botón para cargar PDF */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              Cargar PDF
            </button>

            {/* Botón para mostrar/ocultar PDF */}
            <button
              onClick={togglePdfViewer}
              className={`px-4 py-2 rounded-lg transition-colors ${showPdfViewer
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {showPdfViewer ? '❌ Ocultar PDF' : '📄 Mostrar PDF'}
            </button>
          </div>
        </div>

        {/* Contenido principal - PDF a pantalla completa */}
        <div className="flex-1 overflow-hidden">
          {showPdfViewer ? (
            <div className="h-full flex flex-col">
              {/* Controles del PDF */}
              <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-center gap-4">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reducir zoom"
                >
                  <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700 min-w-[80px] text-center font-medium">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 3.0}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Aumentar zoom"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={resetView}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  🔄 Resetear Vista
                </button>
                <a
                  href={pdfToShow}
                  download={pdfTitle.replace(/\s+/g, '_') + '.pdf'}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  📥 Descargar
                </a>
              </div>

              {/* Visor de PDF mejorado */}
              <div className="h-full overflow-auto bg-gray-100 relative p-4">
                <div className="flex justify-center">
                  <div
                    className="bg-white shadow-lg rounded-lg overflow-hidden"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'center top',
                      transition: 'transform 0.2s ease-out'
                    }}
                  >
                    <iframe
                      src={pdfToShow}
                      className="block"
                      style={{
                        width: '900px',
                        height: '1200px',
                        border: 'none'
                      }}
                      title={pdfTitle}
                      onLoad={() => {
                        console.log('PDF cargado correctamente');
                      }}
                      onError={() => {
                        console.error('Error cargando PDF');
                      }}
                    />
                  </div>
                </div>

                {/* Fallback si el iframe no funciona */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{ zIndex: -1 }}>
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">{pdfTitle}</h3>
                    <p className="text-gray-500 mb-4">
                      Si no se muestra el PDF, puedes descargarlo directamente:
                    </p>
                    <a
                      href={pdfToShow}
                      download={pdfTitle.replace(/\s+/g, '_') + '.pdf'}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      📥 Descargar PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Vista cuando PDF está oculto */
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendario Escolar 2025</h3>
                <p className="text-gray-500 mb-6">
                  El calendario escolar está disponible en formato PDF
                </p>
                <button
                  onClick={togglePdfViewer}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  📄 Mostrar PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal para cargar PDF */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Cargar PDF Personalizado</h3>
              
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {uploadStatus && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                  {uploadStatus}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}