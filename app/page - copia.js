'use client'

import { useState, useEffect } from 'react'
import { groupReportesBySupervisor } from '../lib/supervisors'

export default function Home() {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)

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
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
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
    const totalHoras = reportes.reduce((sum, reporte) => sum + (reporte.tiempo || 0), 0)
    const reportesTerminados = reportes.filter(r => r.terminado).length
    const reportesPendientes = reportes.length - reportesTerminados

    let body = `REPORTE DE MANTENIMIENTO\n`
    body += `Supervisor: ${supervisor.nombre}\n`
    body += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`
    
    body += `RESUMEN:\n`
    body += `- Total de reportes: ${reportes.length}\n`
    body += `- Trabajos terminados: ${reportesTerminados}\n`
    body += `- Trabajos pendientes: ${reportesPendientes}\n`
    body += `- Total de horas: ${totalHoras} horas\n\n`
    
    body += `DETALLE DE REPORTES:\n`
    body += `${'='.repeat(50)}\n\n`
    
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
    
    return body
  }

  const openOutlookEmail = (nombreSupervisor, datos) => {
    const subject = `Reporte de Mantenimiento - ${nombreSupervisor} - ${new Date().toLocaleDateString('es-ES')}`
    
    // Contenido completo para Outlook
    const body = generateEmailBody(datos.supervisor, datos.reportes)

    const mailtoLink = `mailto:${datos.supervisor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Intentar abrir el cliente de correo
    window.location.href = mailtoLink
  }

  const handleDeleteReportes = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los reportes? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setLoading(true)
      setMessage('')
      setError('')

      const response = await fetch('/api/reportes', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Todos los reportes han sido eliminados exitosamente')
        setReportes([])
      } else {
        setError(data.error || 'Error al eliminar reportes')
      }
    } catch (err) {
      setError('Error al eliminar reportes')
    } finally {
      setLoading(false)
    }
  }

  const gruposSupervisores = groupReportesBySupervisor(reportes)

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={handleDeleteReportes}
                disabled={loading || reportes.length === 0}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Eliminando...' : 'Eliminar Todos los Reportes'}
              </button>
            </div>

            {/* Vista previa de reportes por supervisor */}
            {Object.keys(gruposSupervisores).length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vista Previa de Reportes por Supervisor
                </h2>
                
                {Object.entries(gruposSupervisores).map(([nombreSupervisor, datos]) => (
                  <div key={nombreSupervisor} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {nombreSupervisor}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {datos.supervisor.email}
                        </span>
                        <button
                          onClick={() => openOutlookEmail(nombreSupervisor, datos)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
                        >
                          📬 Enviar por Outlook
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {datos.reportes.length} reportes • {' '}
                      {datos.reportes.reduce((sum, r) => sum + (r.tiempo || 0), 0)} horas totales
                    </div>

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
                  </div>
                ))}
              </div>
            )}

            {reportes.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay reportes en la base de datos</p>
                <button
                  onClick={fetchReportes}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Actualizar
                </button>
              </div>
            )}
          </div>
        </div>

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
                      navigator.clipboard.writeText(emailContent)
                      setMessage('✅ Contenido copiado al portapapeles')
                      setShowEmailModal(false)
                    }}
                    className="mb-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  >
                    📋 Copiar Todo
                  </button>
                </div>

                <textarea
                  value={emailContent}
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