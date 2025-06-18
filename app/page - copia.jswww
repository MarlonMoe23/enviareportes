'use client'

import { useState, useEffect } from 'react'

// Data de supervisores integrada con emails de técnicos
const supervisorsData = {
  'Edisson Bejarano': {
    email: 'edisson.bejarano@celec.gob.ec',
    mecanicos: [
      'Roberto Córdova',
      'Juan Carrión', 
      'Miguel Lozada',
      'Cristian Lara',
      'Carlos Cisneros',
      'César Sánchez'
    ],
    emailsTecnicos: {
      'Roberto Córdova': 'roberto.cordova@celec.gob.ec',
      'Juan Carrión': 'juan.carrion@celec.gob.ec',
      'Miguel Lozada': 'miguel.lozada@celec.gob.ec',
      'Cristian Lara': 'cristian.lara@celec.gob.ec',
      'Carlos Cisneros': 'carlos.cisneros@celec.gob.ec',
      'César Sánchez': 'cesar.sanchez@celec.gob.ec'
    }
  },
  'Leonardo Ballesteros': {
    email: 'leonardo.ballesteros@celec.gob.ec',
    mecanicos: [
      'Dario Ojeda',
      'Edgar Ormaza',
      'Alex Haro',
      'Angelo Porras',
      'José Urquizo',
      'Israel Pérez',
      'Kevin Vargas'
    ],
    emailsTecnicos: {
      'Dario Ojeda': 'dario.ojeda@celec.gob.ec',
      'Edgar Ormaza': 'edgar.ormaza@celec.gob.ec',
      'Alex Haro': 'alex.haro@celec.gob.ec',
      'Angelo Porras': 'angelo.porras@celec.gob.ec',
      'José Urquizo': 'jose.urquizo@celec.gob.ec',
      'Israel Pérez': 'jefferson.perez@celec.gob.ec',
      'Kevin Vargas': 'kevin.vargas@celec.gob.ec'
    }
  }
}

// Funciones integradas del archivo supervisors.js
function getSupervisorByMecanico(nombreMecanico) {
  for (const [supervisor, data] of Object.entries(supervisorsData)) {
    if (data.mecanicos.includes(nombreMecanico)) {
      return {
        nombre: supervisor,
        email: data.email
      }
    }
  }
  return null
}

function groupReportesBySupervisor(reportes) {
  const grupos = {}
  reportes.forEach(reporte => {
    const supervisor = getSupervisorByMecanico(reporte.tecnico)
    if (supervisor) {
      if (!grupos[supervisor.nombre]) {
        grupos[supervisor.nombre] = {
          supervisor: supervisor,
          reportes: []
        }
      }
      grupos[supervisor.nombre].reportes.push(reporte)
    }
  })
  return grupos
}

// Función para obtener la fecha del día anterior
function getYesterdayDate() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday
}

// Función para formatear fecha en español
function formatDateSpanish(date) {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function Home() {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [expandedSupervisor, setExpandedSupervisor] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchReportes()
  }, [])

  const fetchReportes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes')
      const data = await response.json()

      if (response.ok) {
        setReportes(data.reportes)
      } else {
        setError(data.error || 'Error al cargar reportes')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error('Error fetching reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteAllReportes = async () => {
    if (deleteCode !== '23') {
      setError('Código de validación incorrecto')
      return
    }

    try {
      setDeleting(true)
      const response = await fetch('/api/reportes', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setReportes([])
        setMessage('✅ Todos los registros han sido eliminados exitosamente')
        setShowDeleteModal(false)
        setDeleteCode('')
      } else {
        setError(data.error || 'Error al eliminar registros')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error('Error deleting reportes:', err)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateEmailBody = (supervisor, reportes) => {
    const reportesTerminados = reportes.filter(r => r.terminado).length
    const reportesPendientes = reportes.length - reportesTerminados

    const horasPorTecnico = {}

    if (supervisor.mecanicos && supervisor.mecanicos.length > 0) {
      supervisor.mecanicos.forEach(tecnico => {
        horasPorTecnico[tecnico] = 0
      })
    }

    reportes.forEach(reporte => {
      const tecnico = reporte.tecnico
      const horas = reporte.tiempo || 0
      if (horasPorTecnico.hasOwnProperty(tecnico)) {
        horasPorTecnico[tecnico] += horas
      } else {
        horasPorTecnico[tecnico] = horas
      }
    })

    // Usar fecha del día anterior para el reporte
    const fechaReporte = getYesterdayDate()
    const fechaReporteFormateada = formatDateSpanish(fechaReporte)

    let body = `REPORTE DE MANTENIMIENTO\n`
    body += `Supervisor: ${supervisor.nombre}\n`
    body += `Fecha del reporte: ${fechaReporteFormateada}\n`
    body += `Enviado: ${formatDateSpanish(new Date())}\n\n`

    body += `RESUMEN:\n`
    body += `- Total de reportes: ${reportes.length}\n`
    body += `- Trabajos terminados: ${reportesTerminados}\n`
    body += `- Trabajos pendientes: ${reportesPendientes}\n`

    if (Object.keys(horasPorTecnico).length > 0) {
      Object.entries(horasPorTecnico)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([tecnico, horas]) => {
          if (horas === 0) {
            body += `- ${tecnico}: ${horas} horas ⚠️ SIN REPORTE\n`
          } else {
            body += `- ${tecnico}: ${horas} ${horas === 1 ? 'hora' : 'horas'}\n`
          }
        })
    } else {
      body += `- Sin técnicos asignados registrados\n`
    }

    body += `\n`
    body += `DETALLE DE REPORTES:\n`
    body += `${'='.repeat(50)}\n\n`

    if (reportes.length === 0) {
      body += `SIN ACTIVIDAD REPORTADA EN ESTE PERÍODO\n\n`
      body += `No se registraron trabajos de mantenimiento para los técnicos\n`
      body += `asignados a este supervisor durante el día ${fechaReporteFormateada}.\n\n`

      if (supervisor.mecanicos && supervisor.mecanicos.length > 0) {
        body += `TÉCNICOS ASIGNADOS QUE NO REPORTARON:\n`
        supervisor.mecanicos.forEach((tecnico, index) => {
          body += `${index + 1}. ${tecnico}\n`
        })
        body += `\n`
      }
    } else {
      reportes.forEach((reporte, index) => {
        body += `${index + 1}. REPORTE\n`
        body += `   Fecha: ${formatDate(reporte.fecha_reporte)}\n`
        body += `   Técnico: ${reporte.tecnico}\n`
        body += `   Planta: ${reporte.planta}\n`
        body += `   OTo: ${reporte.equipo}\n`
        body += `   Trabajo realizado: ${reporte.reporte}\n`
        body += `   Tiempo: ${reporte.tiempo || 0} horas\n`
        body += `   Estado: ${reporte.terminado ? 'TERMINADO' : 'PENDIENTE'}\n\n`
      })
    }

    return body
  }

  const openOutlookEmail = async (nombreSupervisor, datos) => {
    if (!isMounted) return

    // Usar fecha del día anterior para el asunto
    const fechaReporte = getYesterdayDate()
    const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES')

    const subject = `Reporte de Mantenimiento - ${nombreSupervisor} - ${fechaReporteFormateada}`

    const tecnicosQueNoReportaron = []
    const emailsTecnicos = datos.supervisor.emailsTecnicos || {}

    if (datos.supervisor.mecanicos) {
      const tecnicosQueReportaron = [...new Set(datos.reportes.map(r => r.tecnico))]

      datos.supervisor.mecanicos.forEach(tecnico => {
        if (!tecnicosQueReportaron.includes(tecnico)) {
          const emailTecnico = emailsTecnicos[tecnico]
          if (emailTecnico) {
            tecnicosQueNoReportaron.push(emailTecnico)
          }
        }
      })
    }

    const body = generateEmailBody(datos.supervisor, datos.reportes)

    // Construir el mailto link base (sin body para evitar límites de URL)
    let mailtoLink = `mailto:${datos.supervisor.email}?subject=${encodeURIComponent(subject)}`

    if (tecnicosQueNoReportaron.length > 0) {
      const ccEmails = tecnicosQueNoReportaron.join(',')
      mailtoLink += `&cc=${encodeURIComponent(ccEmails)}`
    }

    // Copiar el contenido al portapapeles ANTES de abrir el cliente
    try {
      if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(body)
        setMessage(`✅ Contenido copiado al portapapeles. Cliente de correo abierto para ${nombreSupervisor}. Solo pega (Ctrl+V) en el cuerpo del mensaje.`)
      } else {
        setMessage(`📧 Cliente de correo abierto para ${nombreSupervisor}`)
      }
    } catch (err) {
      console.log('No se pudo copiar al portapapeles automáticamente:', err)
      setMessage(`📧 Cliente de correo abierto para ${nombreSupervisor}`)
    }

    // Abrir el cliente de correo
    try {
      if (typeof window !== 'undefined') {
        window.location.href = mailtoLink
      }
    } catch (err) {
      console.error('Error opening email client:', err)
      setError('No se pudo abrir el cliente de correo. Verifica que tengas un cliente de correo configurado.')
    }
  }

  const getAllSupervisoresWithReportes = () => {
    const gruposSupervisores = groupReportesBySupervisor(reportes)
    const todosSupervisores = {}

    Object.entries(supervisorsData).forEach(([nombre, data]) => {
      todosSupervisores[nombre] = {
        supervisor: {
          nombre: nombre,
          email: data.email,
          mecanicos: data.mecanicos,
          emailsTecnicos: data.emailsTecnicos
        },
        reportes: []
      }
    })

    Object.entries(gruposSupervisores).forEach(([nombre, datos]) => {
      if (todosSupervisores[nombre]) {
        todosSupervisores[nombre].reportes = datos.reportes
      }
    })

    return todosSupervisores
  }

  const todosSupervisoresConReportes = getAllSupervisoresWithReportes()

  // No renderizar hasta que el componente esté montado en el cliente
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo para móviles */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            Sistema de Reportes
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Mantenimiento Mecánico
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-8 py-4 max-w-7xl mx-auto">
        {/* Mensajes - Optimizados para móvil */}
        {message && (
          <div className="mb-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Estadísticas - Stack en móvil, grid en desktop */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">Total</h3>
            <p className="text-xl sm:text-3xl font-bold text-blue-600">{reportes.length}</p>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
            <h3 className="text-xs sm:text-sm font-semibold text-green-900 mb-1">Terminados</h3>
            <p className="text-xl sm:text-3xl font-bold text-green-600">
              {reportes.filter(r => r.terminado).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg text-center">
            <h3 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-1">Pendientes</h3>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600">
              {reportes.filter(r => !r.terminado).length}
            </p>
          </div>
        </div>

        {/* Botón de actualizar - Más grande en móvil */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              fetchReportes()
            }}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 sm:px-8 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            {loading ? 'Actualizando...' : 'Actualizar Datos'}
          </button>
        </div>

        {/* Lista de supervisores - Optimizada para móvil */}
        {Object.keys(todosSupervisoresConReportes).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 px-1">
              Reportes por Supervisor
            </h2>

            {Object.entries(todosSupervisoresConReportes)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([nombreSupervisor, datos]) => {
                const tieneReportes = datos.reportes.length > 0
                const totalHoras = datos.reportes.reduce((sum, r) => sum + (r.tiempo || 0), 0)
                const isExpanded = expandedSupervisor === nombreSupervisor

                return (
                  <div 
                    key={nombreSupervisor} 
                    className={`border rounded-lg ${
                      tieneReportes ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                    } shadow-sm`}
                  >
                    {/* Header del supervisor - Clickeable en móvil */}
                    <div 
                      className="p-3 sm:p-4 cursor-pointer sm:cursor-default"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                          setExpandedSupervisor(isExpanded ? null : nombreSupervisor)
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                              {nombreSupervisor}
                            </h3>
                            {/* Indicador móvil */}
                            <div className="sm:hidden">
                              {isExpanded ? '▼' : '▶'}
                            </div>
                            {!tieneReportes && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full whitespace-nowrap">
                                Sin actividad
                              </span>
                            )}
                          </div>

                          {/* Email - Solo visible en desktop o cuando está expandido */}
                          <div className={`text-xs sm:text-sm text-gray-500 mt-1 ${typeof window !== 'undefined' && window.innerWidth <= 768 && !isExpanded ? 'hidden' : ''}`}>
                            {datos.supervisor.email}
                          </div>
                        </div>
                      </div>

                      {/* Stats rápidas */}
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <span>
                          {datos.reportes.length} reportes • {totalHoras}h
                        </span>

                        {/* Indicador de técnicos sin reportar */}
                        {(() => {
                          const tecnicosQueReportaron = [...new Set(datos.reportes.map(r => r.tecnico))]
                          const tecnicosSinReportar = datos.supervisor.mecanicos?.filter(t => !tecnicosQueReportaron.includes(t)) || []

                          return tecnicosSinReportar.length > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              📧 {tecnicosSinReportar.length} sin reporte
                            </span>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Contenido expandible - Siempre visible en desktop */}
                    <div className={`${typeof window !== 'undefined' && window.innerWidth <= 768 ? (isExpanded ? 'block' : 'hidden') : 'block'}`}>
                      {/* Técnicos asignados */}
                      <div className="px-3 sm:px-4 pb-2">
                        <div className="text-xs text-gray-500">
                          <strong>Técnicos:</strong> {datos.supervisor.mecanicos?.join(', ') || 'No asignados'}
                        </div>
                      </div>

                      {/* Lista de reportes */}
                      {tieneReportes ? (
                        <div className="px-3 sm:px-4 pb-3">
                          <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                            {datos.reportes.map((reporte, index) => (
                              <div key={index} className="text-xs sm:text-sm bg-gray-50 border border-gray-200 p-2 sm:p-3 rounded">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{reporte.tecnico}</div>
                                    <div className="text-gray-600 text-xs truncate">
                                      {reporte.planta} • {reporte.equipo}
                                    </div>
                                  </div>
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    reporte.terminado 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-yellow-500 text-white'
                                  }`}>
                                    {reporte.terminado ? 'OK' : 'Pend'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 sm:px-4 pb-3">
                          <div className="text-center py-3 text-gray-500 bg-gray-100 rounded-lg">
                            <p className="text-xs sm:text-sm">
                              📋 No hay reportes registrados
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botón de enviar correo - Más prominente en móvil */}
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <button
                          onClick={() => openOutlookEmail(nombreSupervisor, datos)}
                          className={`w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                            tieneReportes 
                              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                              : 'bg-gray-400 hover:bg-gray-500 text-white'
                          }`}
                        >
                          📬 {tieneReportes ? 'Enviar Reporte' : 'Enviar Sin Actividad'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {Object.keys(todosSupervisoresConReportes).length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">No hay supervisores ni reportes en la base de datos</p>
            <button
              onClick={() => {
                fetchReportes()
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Actualizar
            </button>
          </div>
        )}
      </div>

      {/* Footer con botón de eliminar - Fijo en la parte inferior en móvil */}
      <div className="sticky bottom-0 sm:relative bg-white border-t border-gray-200 px-4 py-3 mt-8">
        <div className="flex justify-center sm:justify-end">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors py-2 px-4"
          >
            🗑️ Eliminar todos los registros
          </button>
        </div>
      </div>

      {/* Modal para eliminar registros - Optimizado para móvil */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 sm:top-20 mx-auto border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="p-4 sm:p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-red-600">
                  ⚠️ Eliminar Registros
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteCode('')
                    setError('')
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  Esta acción eliminará <strong>TODOS</strong> los registros de la base de datos de forma permanente.
                </p>
                <p className="text-sm text-red-600 mb-4">
                  ⚠️ Esta operación no se puede deshacer.
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresa el código de validación para continuar:
                </label>
                <input
                  type="text"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  placeholder="Código de validación"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
                  maxLength="2"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteCode('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteAllReportes}
                  disabled={deleting || deleteCode !== '23'}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar Todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}