import PageContainer from '../components/PageContainer';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <PageContainer title="Bienvenida Docente" subtitle="Panel de control principal">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        <Link to="/materias" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-purple-400">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-purple-700 text-center">Materias</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Administra tus materias y grupos asignados</p>
        </Link>

        <Link to="/calendario-escolar" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-emerald-400">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-emerald-700 text-center">Calendario Escolar</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Consulta el calendario académico oficial</p>
        </Link>

        <Link to="/asistencia" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-amber-400">
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-amber-700 text-center">Asistencia</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Registra y consulta la asistencia de estudiantes</p>
        </Link>

        <Link to="/notas-docente" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-blue-400">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-blue-700 text-center">Notas Docente</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Bloc de notas personal para el docente</p>
        </Link>

        <Link to="/notas-personales" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-pink-400">
          <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-pink-700 text-center">Notas Personales</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Gestiona tus notas personales</p>
        </Link>

        <Link to="/calendario-personal" className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm cursor-pointer block focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2 text-indigo-700 text-center">Calendario Personal</h2>
          <p className="text-gray-700 text-center text-sm md:text-base">Organiza tus eventos personales</p>
        </Link>
      </div>

      {/* Información del sistema */}
      <div className="mt-8 w-full max-w-4xl mx-auto px-2 sm:px-0">
        <div className="bg-white/95 p-6 rounded-xl shadow-lg border border-white/40 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Estado del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <h4 className="font-semibold text-green-800">Sistema Activo</h4>
                  <p className="text-sm text-green-600">Todas las funciones operativas</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <h4 className="font-semibold text-blue-800">Grado 5B</h4>
                  <p className="text-sm text-blue-600">Datos guardados localmente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}