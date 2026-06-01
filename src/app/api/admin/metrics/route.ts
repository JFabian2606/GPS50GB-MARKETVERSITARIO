import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol de admin o superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.rol !== 'admin' && profile.rol !== 'superadmin')) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // 1. Obtener conteos básicos
    const { count: totalUsuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalPublicaciones } = await supabase
      .from('publicacion')
      .select('*', { count: 'exact', head: true });

    const { count: totalTutorias } = await supabase
      .from('tutoria')
      .select('*', { count: 'exact', head: true });

    // 2. Obtener total ingresos por destaques y pagos para gráfica
    const { data: pagos } = await supabase
      .from('pagos')
      .select('monto, created_at')
      .eq('estado', 'completado');

    const ingresosDestaques = (pagos || []).reduce((sum, p) => sum + parseFloat(p.monto as any), 0);

    // 3. Obtener distribución de roles de usuarios
    const { data: userRoles } = await supabase
      .from('profiles')
      .select('rol');

    const rolesCount = {
      estudiante: 0,
      tutor: 0,
      admin: 0,
      superadmin: 0
    };

    (userRoles || []).forEach(u => {
      const r = u.rol as keyof typeof rolesCount;
      if (rolesCount[r] !== undefined) {
        rolesCount[r]++;
      }
    });

    // 4. Calcular ventas reales de los últimos 5 meses
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const ventasMensuales = [];
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = mesesNombres[d.getMonth()];
      
      const ingresosMes = (pagos || []).filter(p => {
        const pd = new Date(p.created_at);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).reduce((sum, p) => sum + parseFloat(p.monto as any), 0);

      ventasMensuales.push({ mes: monthName, ingresos: ingresosMes });
    }

    const categoriasPopulares = [
      { name: 'Tecnología', value: 45 },
      { name: 'Libros', value: 30 },
      { name: 'Tutorías', value: 15 },
      { name: 'Otros', value: 10 }
    ];

    return NextResponse.json({
      data: {
        resumen: {
          totalUsuarios: totalUsuarios || 0,
          totalPublicaciones: totalPublicaciones || 0,
          totalTutorias: totalTutorias || 0,
          ingresosDestaques
        },
        roles: rolesCount,
        ventasMensuales,
        categoriasPopulares
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
