import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: reportes, error } = await supabase
      .from('reportes')
      .select('*')
      .order('fecha_reporte', { ascending: false })

    if (error) {
      console.error('Error fetching reportes:', error)
      return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 })
    }

    return NextResponse.json({ reportes })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { error } = await supabase
      .from('reportes')
      .delete()
      .neq('id', 0) // Esto borra todos los registros

    if (error) {
      console.error('Error deleting reportes:', error)
      return NextResponse.json({ error: 'Error al eliminar reportes' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Todos los reportes han sido eliminados' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}