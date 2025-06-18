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

export default function Home() {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [currentEmailContent, setCurrentEmailContent] = useState(null)
  const [expandedSupervisor, setExpandedSupervisor] = useState(null)

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

  // FUNCIÓN MEJORADA PARA ABRIR CORREO
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
    
    // Generar el contenido completo del correo
    const body = generateEmailBody(datos.supervisor, datos.reportes)
    
    // Preparar la información del correo para el modal
    const emailData = {
      supervisor: nombreSupervisor,
      email: datos.supervisor.email,
      cc: tecnicosQueNoReportaron,
      subject: subject,
      body: body
    }
    
    // Construir el enlace mailto
    let mailtoLink = `mailto:${datos.supervisor.email}?subject=${encodeURIComponent(subject)}`
    
    // Agregar CC si hay técnicos que no reportaron
    if (tecnicosQueNoReportaron.length > 0) {
      const ccEmails = tecnicosQueNoReportaron.join(',')
      mailtoLink += `&cc=${encodeURIComponent(ccEmails)}`
    }
    
    // Intentar con el contenido completo primero
    const fullMailtoLink = mailtoLink + `&body=${encodeURIComponent(body)}`
    
    // Función para intentar abrir el correo
    const tryOpenEmail = (link) => {
      return new Promise((resolve, reject) => {
        // Crear elemento temporal
        const tempLink = document.createElement('a')
        tempLink.href = link
        tempLink.style.display = 'none'
        document.body.appendChild(tempLink)
        
        // Listener para detectar si la ventana pierde el foco (indicando que se abrió otra app)
        const onBlur = () => {
          setTimeout(() => {
            if (document.body.contains(tempLink)) {
              document.body.removeChild(tempLink)
            }
            window.removeEventListener('blur', onBlur)
            resolve(true)
          }, 100)
        }
        
        // Listener de error o timeout
        const timeout = setTimeout(() => {
          if (document.body.contains(tempLink)) {
            document.body.removeChild(tempLink)
          }
          window.removeEventListener('blur', onBlur)
          reject(new Error('Timeout al abrir cliente de correo'))
        }, 3000)
        
        window.addEventListener('blur', onBlur)
        
        try {
          tempLink.click()
          
          // Si no hay blur en 1 segundo, probablemente falló
          setTimeout(() => {
            clearTimeout(timeout)
            if (document.body.contains(tempLink)) {
              document.body.removeChild(tempLink)
            }
            window.removeEventListener('blur', onBlur)
            reject(new Error('No se detectó apertura del cliente de correo'))
          }, 1000)
          
        } catch (error) {
          clearTimeout(timeout)
          if (document.body.contains(tempLink)) {
            document.body.removeChild(tempLink)
          }
          window.removeEventListener('blur', onBlur)
          reject(error)
        }
      })
    }
    
    // Copiar contenido al portapapeles automáticamente como backup
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(body).catch(() => {
        console.log('No se pudo copiar al portapapeles automáticamente')
      })
    }
    
    // Intentar abrir el correo
    tryOpenEmail(fullMailtoLink)
      .then(() => {
        setMessage(`✅ Cliente de correo abierto para ${nombreSupervisor}. Contenido copiado al portapapeles como respaldo.`)
      })
      .catch((error) => {
        console.log('Método automático falló, mostrando modal:', error.message)
        
        // Si falla, mostrar el modal con toda la información
        setCurrentEmailContent(emailData)
        setShowEmailModal(true)
        setMessage(`📧 Preparando correo para ${nombreSupervisor}. Se abrirá ventana con los detalles.`)
      })
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
    <div className="min-h-screen bg-gray-50 py-2 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header mejorado para móvil */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
              Sistema de Reportes de Mantenimiento
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Gestiona reportes de mantenimiento mecánico
            </p>
          </div>

          <div className="p-3 sm:p-6">
            {/* Mensajes - Mejorados para móvil */}
            {message && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Estadísticas - Optimizadas para móvil */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-lg font-semibold text-blue-900 leading-tight">Total</h3>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{reportes.length}</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-lg font-semibold text-green-900 leading-tight">Terminados</h3>
                <p className="text-xl sm:text-3xl font-bold text-green-600">
                  {reportes.filter(r => r.terminado).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-lg font-semibold text-yellow-900 leading-tight">Pendientes</h3>
                <p className="text-xl sm:text-3xl font-bold text-yellow-600">
                  {reportes.filter(r => !r.terminado).length}
                </p>
              </div>
            </div>

            {/* Botón de actualizar - Mejorado para móvil */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <button
                onClick={() => {
                  fetchReportes()
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                {loading ? 'Actualizando...' : 'Actualizar Datos'}
              </button>
            </div>

            {/* Vista mejorada: TODOS los supervisores - Optimizada para móvil */}
            {Object.keys(todosSupervisoresConReportes).length > 0 && (
              <div className="space-y-3 sm:space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Reportes por Supervisor
                </h2>
                
                {Object.entries(todosSupervisoresConReportes)
                  .sort(([a], [b]) => a.localeCompare(b)) // Ordenar alfabéticamente
                  .map(([nombreSupervisor, datos]) => {
                    const tieneReportes = datos.reportes.length > 0
                    const totalHoras = datos.reportes.reduce((sum, r) => sum + (r.tiempo || 0), 0)
                    const isExpanded = expandedSupervisor === nombreSupervisor
                    
                    return (
                      <div 
                        key={nombreSupervisor} 
                        className={`border rounded-lg p-3 sm:p-4 ${
                          tieneReportes ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {/* Header del supervisor - Layout móvil */}
                        <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                              {nombreSupervisor}
                            </h3>
                            {!tieneReportes && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                Sin actividad
                              </span>
                            )}
                          </div>
                          
                          {/* Información y botones - Stack en móvil */}
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                            <span className="text-xs sm:text-sm text-gray-500 truncate">
                              {datos.supervisor.email}
                            </span>
                            
                            {/* Indicador de técnicos sin reportar */}
                            {(() => {
                              const tecnicosQueReportaron = [...new Set(datos.reportes.map(r => r.tecnico))]
                              const tecnicosSinReportar = datos.supervisor.mecanicos?.filter(t => !tecnicosQueReportaron.includes(t)) || []
                              
                              return tecnicosSinReportar.length > 0 && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full self-start sm:self-auto">
                                  📧 {tecnicosSinReportar.length} técnicos no reportan
                                </span>
                              )
                            })()}
                            
                            {/* Botón de enviar - Ajustado para móvil */}
                            <button
                              onClick={() => openOutlookEmail(nombreSupervisor, datos)}
                              className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto ${
                                tieneReportes 
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                  : 'bg-gray-400 hover:bg-gray-500 text-white'
                              }`}
                              title={`Enviar reporte por correo a ${datos.supervisor.email}`}
                            >
                              📬 {tieneReportes ? 'Enviar Reporte' : 'Enviar Sin Actividad'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Estadísticas del supervisor */}
                        <div className="text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex flex-wrap gap-2 sm:gap-4">
                            <span>{datos.reportes.length} reportes</span>
                            <span>{totalHoras} horas totales</span>
                            {!tieneReportes && (
                              <span className="text-orange-600">
                                Sin actividad reportada
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón para expandir/contraer técnicos en móvil */}
                        <button
                          onClick={() => setExpandedSupervisor(isExpanded ? null : nombreSupervisor)}
                          className="w-full text-left text-xs text-gray-500 hover:text-gray-700 mb-3 sm:hidden"
                        >
                          {isExpanded ? '▼' : '▶'} Ver técnicos asignados ({datos.supervisor.mecanicos?.length || 0})
                        </button>

                        {/* Mostrar mecánicos asignados - Siempre visible en escritorio */}
                        <div className={`text-xs text-gray-500 mb-3 ${isExpanded ? 'block' : 'hidden'} sm:block`}>
                          <span className="font-medium">Técnicos: </span>
                          {datos.supervisor.mecanicos?.join(', ') || 'No asignados'}
                        </div>

                        {/* Reportes - Mejorados para móvil */}
                        {tieneReportes ? (
                          <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                            {datos.reportes.map((reporte, index) => (
                              <div key={index} className="text-xs sm:text-sm bg-white border border-gray-200 p-2 sm:p-3 rounded shadow-sm">
                                <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                                  <div className="text-gray-800">
                                    <span className="font-semibold text-gray-900 block sm:inline">{reporte.tecnico}</span>
                                    <span className="text-gray-600 text-xs sm:text-sm block sm:inline sm:ml-1">
                                      {reporte.planta} • {reporte.equipo}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
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
                          <div className="text-center py-3 sm:py-4 text-gray-500 bg-gray-100 rounded-lg">
                            <p className="text-xs sm:text-sm">
                              📋 No hay reportes registrados para este supervisor
                            </p>
                            <p className="text-xs mt-1">
                              Puedes enviar un reporte indicando "sin actividad" para mantener el registro
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {Object.keys(todosSupervisoresConReportes).length === 0 && !loading && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
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

          {/* Botón de eliminar registros - Discreto al final */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
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

        {/* Modal para eliminar registros - Mejorado para móvil */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-2 sm:px-0">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-red-600">
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
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors text-sm"
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={deleteAllReportes}
                    disabled={deleting || deleteCode !== '23'}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar Todo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL MEJORADO PARA MOSTRAR CONTENIDO DEL CORREO - Optimizado para móvil */}
        {showEmailModal && currentEmailContent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-2 sm:px-0">
            <div className="relative top-4 sm:top-10 mx-auto p-3 sm:p-5 border w-full max-w-full sm:max-w-5xl shadow-lg rounded-md bg-white mb-4">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900">
                    📧 Crear Correo - {currentEmailContent.supervisor}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEmailModal(false)
                      setCurrentEmailContent(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {/* Instrucciones claras - Mejoradas para móvil */}
                <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">📋 Instrucciones:</h4>
                  <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <li><strong>1.</strong> Copia los destinatarios y asunto</li>
                    <li><strong>2.</strong> Abre tu cliente de correo (Outlook, Gmail, etc.)</li>
                    <li><strong>3.</strong> Crea un nuevo correo y pega la información</li>
                    <li><strong>4.</strong> Copia y pega el contenido del mensaje</li>
                  </ol>
                </div>
                
                {/* Información del correo - Layout mejorado para móvil */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Para:</label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input 
                          type="text" 
                          value={currentEmailContent.email} 
                          readOnly 
                          className="flex-1 p-2 text-sm bg-white border rounded"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentEmailContent.email)
                            setMessage('✅ Email del destinatario copiado')
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs w-full sm:w-auto"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    
                    {currentEmailContent.cc.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">CC:</label>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <input 
                            type="text" 
                            value={currentEmailContent.cc.join(', ')} 
                            readOnly 
                            className="flex-1 p-2 text-sm bg-white border rounded"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentEmailContent.cc.join(', '))
                              setMessage('✅ Emails CC copiados')
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs w-full sm:w-auto"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto:</label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input 
                          type="text" 
                          value={currentEmailContent.subject} 
                          readOnly 
                          className="flex-1 p-2 text-sm bg-white border rounded"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentEmailContent.subject)
                            setMessage('✅ Asunto copiado')
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs w-full sm:w-auto"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                    
                    {/* Botón para intentar abrir correo nuevamente */}
                    <div className="p-3 bg-green-50 rounded-lg">
                      <button
                        onClick={() => {
                          const mailtoLink = `mailto:${currentEmailContent.email}?subject=${encodeURIComponent(currentEmailContent.subject)}${currentEmailContent.cc.length > 0 ? `&cc=${encodeURIComponent(currentEmailContent.cc.join(','))}` : ''}&body=${encodeURIComponent(currentEmailContent.body)}`
                          window.location.href = mailtoLink
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        🔄 Intentar Abrir Correo Automáticamente
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Contenido del mensaje - Mejorado para móvil */}
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                    <label className="block text-sm font-semibold text-gray-700">Contenido del Mensaje:</label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentEmailContent.body)
                        setMessage('✅ Contenido del mensaje copiado al portapapeles')
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium w-full sm:w-auto"
                    >
                      📋 Copiar Contenido
                    </button>
                  </div>
                  
                  <textarea
                    value={currentEmailContent.body}
                    readOnly
                    className="w-full h-60 sm:h-80 p-3 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm bg-gray-50 resize-none"
                    placeholder="Contenido del correo..."
                  />
                </div>
                
                {/* Botones de acción - Mejorados para móvil */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                  <button
                    onClick={() => {
                      const fullEmailText = `Para: ${currentEmailContent.email}\n${currentEmailContent.cc.length > 0 ? `CC: ${currentEmailContent.cc.join(', ')}\n` : ''}Asunto: ${currentEmailContent.subject}\n\n${currentEmailContent.body}`
                      navigator.clipboard.writeText(fullEmailText)
                      setMessage('✅ Email completo copiado (destinatarios + asunto + contenido)')
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium w-full sm:w-auto"
                  >
                    📧 Copiar Email Completo
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowEmailModal(false)
                      setCurrentEmailContent(null)
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium w-full sm:w-auto"
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