import { useState, useRef } from 'react'
import { MagnifyingGlassIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import calendarioPdf from '../assets/Resoluciones cronograma 2025 v1.pdf'

export default function CalendarioEscolar() {
  const [showPdfViewer, setShowPdfViewer] = useState(true) // Mostrar PDF por defecto
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const pdfContainerRef = useRef(null)
  const pdfViewerRef = useRef(null)

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

  // Centrar el PDF al cargar
  const centerPdf = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <PageContainer>
      <div className="h-full bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col overflow-hidden">
        {/* Header minimalista */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Calendario Escolar 2025</h1>

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
                  href={calendarioPdf}
                  download="Calendario_Escolar_2025.pdf"
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
                      src={calendarioPdf}
                      className="block"
                      style={{
                        width: '900px',
                        height: '1200px',
                        border: 'none'
                      }}
                      title="Calendario Escolar 2025"
                      onLoad={() => {
                        console.log('✅ PDF cargado correctamente')
                      }}
                      onError={() => {
                        console.error('❌ Error cargando PDF')
                      }}
                    />
                  </div>
                </div>

                {/* Fallback si el iframe no funciona */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{ zIndex: -1 }}>
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Calendario Escolar 2025</h3>
                    <p className="text-gray-500 mb-4">
                      Si no se muestra el PDF, puedes descargarlo directamente:
                    </p>
                    <a
                      href={calendarioPdf}
                      download="Calendario_Escolar_2025.pdf"
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
      </div>
    </PageContainer>
  )
}