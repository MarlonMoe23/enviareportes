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
    // Emails de los técnicos (agregar según tengas los datos reales)
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
    // Emails de los técnicos (agregar según tengas los datos reales)
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

export default function Home() {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
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
    } catch (error) {
      setError('Error al conectar con el servidor')
      console.error('Error fetching reportes:', error)
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
    } catch (error) {
      setError('Error al conectar con el servidor')
      console.error('Error deleting reportes:', error)
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

    // Agrupar horas por técnico
    const horasPorTecnico = {}
    
    // Primero: inicializar TODOS los técnicos asignados con 0 horas
    if (supervisor.mecanicos && supervisor.mecanicos.length > 0) {
      supervisor.mecanicos.forEach(tecnico => {
        horasPorTecnico[tecnico] = 0
      })
    }
    
    // Segundo: sumar las horas reales de los que SÍ reportaron
    reportes.forEach(reporte => {
      const tecnico = reporte.tecnico
      const horas = reporte.tiempo || 0
      if (horasPorTecnico.hasOwnProperty(tecnico)) {
        horasPorTecnico[tecnico] += horas
      } else {
        // Si el técnico no está en la lista asignada, agregarlo anyway
        horasPorTecnico[tecnico] = horas
      }
    })

    let body = `REPORTE DE MANTENIMIENTO\n`
    body += `Supervisor: ${supervisor.nombre}\n`
    body += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`
    
    body += `RESUMEN:\n`
    body += `- Total de reportes: ${reportes.length}\n`
    body += `- Trabajos terminados: ${reportesTerminados}\n`
    body += `- Trabajos pendientes: ${reportesPendientes}\n`
    
    // Mostrar TODOS los técnicos (con y sin horas)
    if (Object.keys(horasPorTecnico).length > 0) {
      Object.entries(horasPorTecnico)
        .sort(([a], [b]) => a.localeCompare(b)) // Ordenar alfabéticamente
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
      body += `asignados a este supervisor durante el período reportado.\n\n`
      
      // Listar técnicos que deberían haber reportado
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

  const openOutlookEmail = (nombreSupervisor, datos) => {
    const subject = `Reporte de Mantenimiento - ${nombreSupervisor} - ${new Date().toLocaleDateString('es-ES')}`
    
    // Identificar técnicos que NO reportaron
    const tecnicosQueNoReportaron = []
    const emailsTecnicos = datos.supervisor.emailsTecnicos || {}
    
    if (datos.supervisor.mecanicos) {
      // Obtener lista de técnicos que SÍ reportaron
      const tecnicosQueReportaron = [...new Set(datos.reportes.map(r => r.tecnico))]
      
      // Encontrar los que NO reportaron
      datos.supervisor.mecanicos.forEach(tecnico => {
        if (!tecnicosQueReportaron.includes(tecnico)) {
          const emailTecnico = emailsTecnicos[tecnico]
          if (emailTecnico) {
            tecnicosQueNoReportaron.push(emailTecnico)
          }
        }
      })
    }
    
    // Contenido completo para Outlook
    const body = generateEmailBody(datos.supervisor, datos.reportes)
    
    // Construir el enlace mailto con CC
    let mailtoLink = `mailto:${datos.supervisor.email}?subject=${encodeURIComponent(subject)}`
    
    // Agregar CC si hay técnicos que no reportaron
    if (tecnicosQueNoReportaron.length > 0) {
      const ccEmails = tecnicosQueNoReportaron.join(',')
      mailtoLink += `&cc=${encodeURIComponent(ccEmails)}`
    }
    
    // Agregar el cuerpo del mensaje
    mailtoLink += `&body=${encodeURIComponent(body)}`
    
    // Intentar abrir el cliente de correo
    window.location.href = mailtoLink
  }

  // Función mejorada: combinar supervisores con y sin reportes
  const getAllSupervisoresWithReportes = () => {
    const gruposSupervisores = groupReportesBySupervisor(reportes)
    const todosSupervisores = {}

    // Primero agregar TODOS los supervisores de la data fija (incluso sin reportes)
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

    // Luego sobrescribir con los que SÍ tienen reportes
    Object.entries(gruposSupervisores).forEach(([nombre, datos]) => {
      if (todosSupervisores[nombre]) {
        todosSupervisores[nombre].reportes = datos.reportes
      }
    })

    return todosSupervisores
  }

  const todosSupervisoresConReportes = getAllSupervisoresWithReportes()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Reportes de Mantenimiento
            </h1>
            <p className="text-gray-600 mt-2">
              Envía reportes por correo y gestiona la base de datos
            </p>
          </div>

          <div className="p-6">
            {/* Mensajes */}
            {message && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">Total Reportes</h3>
                <p className="text-3xl font-bold text-blue-600">{reportes.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">Terminados</h3>
                <p className="text-3xl font-bold text-green-600">
                  {reportes.filter(r => r.terminado).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900">Pendientes</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {reportes.filter(r => !r.terminado).length}
                </p>
              </div>
              {/* Nueva estadística: Supervisores */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">Supervisores</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {Object.keys(todosSupervisoresConReportes).length}
                </p>
              </div>
            </div>

            {/* Botón de actualizar */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => {
                  fetchReportes()
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Actualizando...' : 'Actualizar Datos'}
              </button>
            </div>

            {/* Vista mejorada: TODOS los supervisores */}
            {Object.keys(todosSupervisoresConReportes).length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reportes por Supervisor ({Object.keys(todosSupervisoresConReportes).length} supervisores)
                </h2>
                
                {Object.entries(todosSupervisoresConReportes)
                  .sort(([a], [b]) => a.localeCompare(b)) // Ordenar alfabéticamente
                  .map(([nombreSupervisor, datos]) => {
                    const tieneReportes = datos.reportes.length > 0
                    const totalHoras = datos.reportes.reduce((sum, r) => sum + (r.tiempo || 0), 0)
                    
                    return (
                      <div 
                        key={nombreSupervisor} 
                        className={`border rounded-lg p-4 ${
                          tieneReportes ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {nombreSupervisor}
                            </h3>
                            {!tieneReportes && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                Sin actividad
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {datos.supervisor.email}
                            </span>
                            {/* Mostrar indicador si hay técnicos sin reportar */}
                            {(() => {
                              const tecnicosQueReportaron = [...new Set(datos.reportes.map(r => r.tecnico))]
                              const tecnicosSinReportar = datos.supervisor.mecanicos?.filter(t => !tecnicosQueReportaron.includes(t)) || []
                              
                              return tecnicosSinReportar.length > 0 && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  📧 +{tecnicosSinReportar.length} en copia
                                </span>
                              )
                            })()}
                            <button
                              onClick={() => openOutlookEmail(nombreSupervisor, datos)}
                              className={`px-4 py-2 rounded text-sm font-medium ${
                                tieneReportes 
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                  : 'bg-gray-400 hover:bg-gray-500 text-white'
                              }`}
                            >
                              📬 {tieneReportes ? 'Enviar Reporte' : 'Enviar Sin Actividad'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          {datos.reportes.length} reportes • {totalHoras} horas totales
                          {!tieneReportes && (
                            <span className="text-orange-600 ml-2">
                              • No se registró actividad en este período
                            </span>
                          )}
                          {/* Mostrar mecánicos asignados */}
                          <div className="text-xs text-gray-500 mt-1">
                            Mecánicos: {datos.supervisor.mecanicos?.join(', ') || 'No asignados'}
                          </div>
                        </div>

                        {tieneReportes ? (
                          <div className="grid gap-2 max-h-40 overflow-y-auto">
                            {datos.reportes.map((reporte, index) => (
                              <div key={index} className="text-sm bg-white border border-gray-200 p-3 rounded shadow-sm">
                                <div className="flex justify-between items-center">
                                  <div className="text-gray-800">
                                    <span className="font-semibold text-gray-900">{reporte.tecnico}</span>
                                    <span className="text-gray-600"> • {reporte.planta} • {reporte.equipo}</span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    reporte.terminado 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-yellow-500 text-white'
                                  }`}>
                                    {reporte.terminado ? 'Terminado' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                            <p className="text-sm">
                              📋 No hay reportes registrados para este supervisor
                            </p>
                            <p className="text-xs mt-1">
                              Puedes enviar un reporte indicando &quot;sin actividad&quot; para mantener el registro
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {Object.keys(todosSupervisoresConReportes).length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay supervisores ni reportes en la base de datos</p>
                <button
                  onClick={() => {
                    fetchReportes()
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Actualizar
                </button>
              </div>
            )}
          </div>

          {/* Botón de eliminar registros - Discreto al final */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                🗑️ Eliminar todos los registros
              </button>
            </div>
          </div>
        </div>

        {/* Modal para eliminar registros */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
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
                    className="text-gray-400 hover:text-gray-600"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    maxLength="2"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteCode('')
                      setError('')
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={deleteAllReportes}
                    disabled={deleting || deleteCode !== '23'}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar Todo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para mostrar contenido del correo */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Contenido de los Correos
                  </h3>
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Copia el siguiente contenido y pégalo en Outlook:
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('')
                      setMessage('✅ Contenido copiado al portapapeles')
                      setShowEmailModal(false)
                    }}
                    className="mb-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    📋 Copiar Todo
                  </button>
                </div>

                <textarea
                  value=""
                  readOnly
                  className="w-full h-96 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  style={{ resize: 'none' }}
                />
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}