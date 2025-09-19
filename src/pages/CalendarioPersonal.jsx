import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon, CalendarDaysIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline'
import PageContainer from '../components/PageContainer'
import db from '../utils/database'

export default function CalendarioPersonal() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [events, setEvents] = useState([])
    const [holidays, setHolidays] = useState([])
    const [showEventModal, setShowEventModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'personal', // personal, academico, trabajo, cita
        reminder: '15', // minutos antes
        location: ''
    })

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    // Cargar días festivos desde la API
    const fetchHolidays = async (year) => {
        try {
            setLoading(true)

            // API gratuita de días festivos de Colombia
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`)

            if (response.ok) {
                const holidaysData = await response.json()
                const formattedHolidays = holidaysData.map(holiday => ({
                    id: `holiday-${holiday.date}`,
                    date: holiday.date,
                    title: holiday.localName || holiday.name,
                    description: holiday.name !== holiday.localName ? holiday.name : '',
                    type: 'festivo',
                    isHoliday: true,
                    global: holiday.global,
                    counties: holiday.counties
                }))

                return formattedHolidays
            } else {
                return []
            }
        } catch (error) {
            console.error('Error fetching holidays:', error)
            return []
        } finally {
            setLoading(false)
        }
    }

    // Cargar eventos desde Supabase al iniciar
    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar eventos personales desde Supabase
                const userEventsDB = await db.getEventosCalendario()
                const userEvents = userEventsDB.map(evento => ({
                    id: evento.id,
                    date: evento.fecha,
                    title: evento.titulo,
                    description: evento.descripcion,
                    startTime: evento.hora_inicio,
                    endTime: evento.hora_fin,
                    type: evento.tipo,
                    reminder: evento.recordatorio,
                    location: evento.ubicacion,
                    isHoliday: false,
                    createdAt: evento.created_at
                }))

                // Cargar días festivos para el año actual y siguiente
                const currentYear = new Date().getFullYear()
                const currentYearHolidays = await fetchHolidays(currentYear)
                const nextYearHolidays = await fetchHolidays(currentYear + 1)

                const allHolidays = [...currentYearHolidays, ...nextYearHolidays]
                setHolidays(allHolidays)

                // Combinar eventos de usuario con días festivos
                setEvents([...userEvents, ...allHolidays])
                
            } catch (error) {
                console.error('❌ Error cargando eventos:', error)
                // Cargar solo días festivos en caso de error
                const currentYear = new Date().getFullYear()
                const currentYearHolidays = await fetchHolidays(currentYear)
                const nextYearHolidays = await fetchHolidays(currentYear + 1)
                const allHolidays = [...currentYearHolidays, ...nextYearHolidays]
                setHolidays(allHolidays)
                setEvents(allHolidays)
            }
        }

        loadData()
    }, [])

    // Detectar si es móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }

        checkIfMobile()
        window.addEventListener('resize', checkIfMobile)

        return () => window.removeEventListener('resize', checkIfMobile)
    }, [])

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())

        const days = []
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 41) // 6 semanas

        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d))
        }

        return days
    }

    const formatDate = (date) => {
        return date.toISOString().split('T')[0]
    }

    const getEventsForDate = (date) => {
        const dateStr = formatDate(date)
        return events.filter(event => event.date === dateStr)
    }

    const handleAddEvent = async () => {
        if (!selectedDate || !eventForm.title.trim()) return

        try {
            const newEvent = {
                titulo: eventForm.title.trim(),
                descripcion: eventForm.description.trim(),
                fecha: formatDate(selectedDate),
                hora_inicio: eventForm.startTime,
                hora_fin: eventForm.endTime,
                tipo: eventForm.type,
                recordatorio: parseInt(eventForm.reminder),
                ubicacion: eventForm.location.trim(),
            }

            // Guardar en Supabase
            const eventoGuardado = await db.guardarEventoCalendario(newEvent)

            // Actualizar estado local
            const eventoLocal = {
                id: eventoGuardado.id,
                date: eventoGuardado.fecha,
                title: eventoGuardado.titulo,
                description: eventoGuardado.descripcion,
                startTime: eventoGuardado.hora_inicio,
                endTime: eventoGuardado.hora_fin,
                type: eventoGuardado.tipo,
                reminder: eventoGuardado.recordatorio,
                location: eventoGuardado.ubicacion,
                isHoliday: false,
                createdAt: eventoGuardado.created_at
            }

            setEvents(prev => [...prev, eventoLocal])
            resetEventForm()
            setShowEventModal(false)
            
        } catch (error) {
            console.error('❌ Error guardando evento:', error)
            alert('Error al guardar el evento')
        }
    }

    const handleDeleteEvent = async (eventId) => {
        try {
            // Eliminar de Supabase
            await db.eliminarEventoCalendario(eventId)
            
            // Actualizar estado local
            setEvents(events.filter(event => event.id !== eventId))
            
        } catch (error) {
            console.error('❌ Error eliminando evento:', error)
            alert('Error al eliminar el evento')
        }
    }

    const resetEventForm = () => {
        setEventForm({
            title: '',
            description: '',
            startTime: '',
            endTime: '',
            type: 'personal',
            reminder: '15',
            location: ''
        })
    }

    const openEventModal = (date) => {
        setSelectedDate(date)
        setShowEventModal(true)
    }

    const closeEventModal = () => {
        setShowEventModal(false)
        setSelectedDate(null)
        resetEventForm()
    }

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'festivo': return 'bg-red-100 text-red-800 border-red-200'
            case 'academico': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'trabajo': return 'bg-green-100 text-green-800 border-green-200'
            case 'cita': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getEventTypeIcon = (type) => {
        switch (type) {
            case 'festivo': return '🎉'
            case 'academico': return '📚'
            case 'trabajo': return '💼'
            case 'cita': return '📅'
            case 'personal': return '⭐'
            default: return '📌'
        }
    }

    const formatTime = (time) => {
        if (!time) return ''
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
    }

    const days = getDaysInMonth(currentMonth)
    const today = new Date()

    return (
        <PageContainer>
            <div className="h-full bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 flex flex-col lg:overflow-hidden overflow-visible">
                {/* Header del calendario */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <button
                        onClick={prevMonth}
                        className="p-3 rounded-full hover:bg-purple-100 transition-colors duration-200 text-purple-600 hover:text-purple-800"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-purple-800">
                            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h2>
                        {loading && (
                            <div className="text-sm text-gray-500 mt-1">
                                Cargando días festivos...
                            </div>
                        )}
                    </div>
                    <button
                        onClick={nextMonth}
                        className="p-3 rounded-full hover:bg-purple-100 transition-colors duration-200 text-purple-600 hover:text-purple-800"
                    >
                        <ChevronRightIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-2 mb-3 flex-shrink-0">
                    {daysOfWeek.map((day) => (
                        <div key={day} className="text-center text-purple-700 font-semibold py-1 text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendario */}
                <div className="grid grid-cols-7 gap-2 mb-4 lg:flex-1 lg:overflow-hidden">
                    {days.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                        const isToday = formatDate(day) === formatDate(today)
                        const dayEvents = getEventsForDate(day)
                        const hasHoliday = dayEvents.some(event => event.isHoliday)

                        return (
                            <div
                                key={index}
                                className={`lg:h-16 min-h-[80px] p-1 border rounded-lg cursor-pointer transition-all duration-200 ${isCurrentMonth
                                    ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                                    : 'border-gray-100 bg-gray-50 text-gray-400'
                                    } ${isToday ? 'ring-2 ring-purple-400 bg-purple-100' : ''} ${hasHoliday ? 'bg-red-50 border-red-200' : ''
                                    }`}
                                onClick={() => isCurrentMonth && openEventModal(day)}
                            >
                                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-purple-800' : hasHoliday ? 'text-red-700' : ''}`}>
                                    {day.getDate()}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, isMobile ? 3 : 1).map((event) => (
                                        <div
                                            key={event.id}
                                            className={`text-xs px-1 py-0.5 rounded border truncate ${getEventTypeColor(event.type)} flex items-center gap-1`}
                                            title={`${event.title}${event.startTime ? ` - ${formatTime(event.startTime)}` : ''}`}
                                        >
                                            <span className="text-xs">{getEventTypeIcon(event.type)}</span>
                                            <span className="truncate">{event.title}</span>
                                        </div>
                                    ))}
                                    {((!isMobile && dayEvents.length > 1) || (isMobile && dayEvents.length > 3)) && (
                                        <div className="text-xs text-gray-500 px-1">
                                            +{dayEvents.length - (isMobile ? 3 : 1)} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap gap-2 lg:gap-3 justify-center text-xs flex-shrink-0 lg:mt-auto pt-3">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                        <span className="text-gray-600">🎉 Días Festivos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                        <span className="text-gray-600">📚 Académico</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                        <span className="text-gray-600">📅 Citas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
                        <span className="text-gray-600">⭐ Personal</span>
                    </div>
                </div>
            </div>

            {/* Modal para agregar eventos */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                                Agregar Evento
                            </h3>
                            <button
                                onClick={closeEventModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha seleccionada
                                </label>
                                <div className="text-lg font-semibold text-purple-600 bg-purple-50 p-3 rounded-lg">
                                    {selectedDate?.toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título del evento *
                                </label>
                                <input
                                    type="text"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Reunión importante"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de evento
                                </label>
                                <select
                                    value={eventForm.type}
                                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="personal">⭐ Personal</option>
                                    <option value="academico">📚 Académico</option>
                                    <option value="cita">📅 Cita</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <ClockIcon className="w-4 h-4 inline mr-1" />
                                        Hora inicio
                                    </label>
                                    <input
                                        type="time"
                                        value={eventForm.startTime}
                                        onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <ClockIcon className="w-4 h-4 inline mr-1" />
                                        Hora fin
                                    </label>
                                    <input
                                        type="time"
                                        value={eventForm.endTime}
                                        onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ubicación
                                </label>
                                <input
                                    type="text"
                                    value={eventForm.location}
                                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ej: Sala de juntas, Universidad..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recordatorio
                                </label>
                                <select
                                    value={eventForm.reminder}
                                    onChange={(e) => setEventForm({ ...eventForm, reminder: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="0">Sin recordatorio</option>
                                    <option value="5">5 minutos antes</option>
                                    <option value="15">15 minutos antes</option>
                                    <option value="30">30 minutos antes</option>
                                    <option value="60">1 hora antes</option>
                                    <option value="1440">1 día antes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Descripción adicional..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeEventModal}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddEvent}
                                disabled={!eventForm.title.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Agregar Evento
                            </button>
                        </div>

                        {/* Eventos existentes para la fecha seleccionada */}
                        {selectedDate && getEventsForDate(selectedDate).length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    Eventos existentes:
                                </h4>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                    {getEventsForDate(selectedDate).map((event) => (
                                        <div
                                            key={event.id}
                                            className={`p-3 rounded-lg border text-sm ${getEventTypeColor(event.type)}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span>{getEventTypeIcon(event.type)}</span>
                                                        <div className="font-medium">{event.title}</div>
                                                    </div>
                                                    {(event.startTime || event.endTime) && (
                                                        <div className="text-xs opacity-75 flex items-center gap-1 mb-1">
                                                            <ClockIcon className="w-3 h-3" />
                                                            {event.startTime && formatTime(event.startTime)}
                                                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                                                        </div>
                                                    )}
                                                    {event.location && (
                                                        <div className="text-xs opacity-75 mb-1">
                                                            📍 {event.location}
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <div className="text-xs opacity-75">
                                                            {event.description}
                                                        </div>
                                                    )}
                                                </div>
                                                {!event.isHoliday && (
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="text-red-500 hover:text-red-700 ml-2 p-1 rounded hover:bg-red-50"
                                                        title="Eliminar evento"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageContainer>
    )
}