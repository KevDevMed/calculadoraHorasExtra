Eres un ingeniero senior de front-end (TypeScript + React) y analista de nómina colombiana.
Vas a construir una herramienta 100% front-only (sin backend) estilo calculadora comparativa para:
1) Calcular pagos por horas extra y trabajo en festivos según POLÍTICA INTERNA de la empresa.
2) Calcular lo equivalente según LEY COLOMBIANA (CST + leyes modificatorias).
3) Mostrar diferencias (brechas) y alertas de cumplimiento.

STACK / UI:
- React + TypeScript
- shadcn/ui + Tailwind
- Sin backend: estado local + persistencia opcional en localStorage
- Exportar resultados a CSV (y opcional: copiar al portapapeles)

POLÍTICAS INTERNAS (motor #1):
- Jornada base “corta”: 37.5 h/semana (37:30)
- Horas extra: SOLO después de 40 h/semana. Se pagan a 1.5x.
- “Colchón” 2.5 horas: de 37.5 a 40 se pagan como hora normal (1.0x).
- No manejan recargos nocturnos ni dominicales (se instruye no trabajar domingos).
- Festivos: se pagan al doble (2.0x). Ej: 8h festivo => 16h pagadas.
- Extras y festivos se pagan “atrasados” (~15 días) por periodo cerrado.
  - La app debe mostrar “Periodo donde se trabajó” vs “Periodo donde se paga” (estimado configurable).

LEY COLOMBIANA (motor #2) — implementar reglas vigentes:
- Definición diurno/nocturno: diurno 6:00–21:00, nocturno 21:00–6:00.
- Recargo nocturno ordinario: +35% (1.35x) si es nocturno dentro de jornada ordinaria.
- Hora extra diurna: +25% (1.25x).
- Hora extra nocturna: +75% (1.75x).
- Domingo/festivo: recargo +75% (1.75x) por horas trabajadas en descanso obligatorio.
- La jornada máxima semanal se redujo gradualmente (para 2025: 44h/semana desde 15-jul-2025).
  - La app debe permitir al usuario elegir el “límite semanal legal” (44 o 42) y explicar por qué.
- IMPORTANTE: la app debe soportar “combinaciones” típicas para domingos/festivos:
  - Ordinaria diurna dominical/festiva: 1.75x
  - Ordinaria nocturna dominical/festiva: 1 + 0.75 + 0.35 = 2.10x
  - Extra diurna dominical/festiva: 1 + 0.75 + 0.25 = 2.00x
  - Extra nocturna dominical/festiva: 1 + 0.75 + 0.75 = 2.50x
(Explica en la UI que el usuario puede elegir “modelo de cálculo”: (A) total de la hora vs (B) solo el adicional, para no duplicar base salarial si ya se paga mensual.)

ENTRADAS (UI):
1) Datos de pago:
- Tipo de salario: (a) mensual, (b) por hora
- Salario mensual o valor hora
- Días laborables por semana (5 o 6)
- Horas base semanales internas: 37.5 (editable)
- Límite interno para extra: 40 (editable)
- Multiplicadores internos: extra 1.5, festivo 2.0 (editables)
- Parámetros legales: límite semanal (44/42), nocturno desde 21:00 (editable por si cambia), recargos (35/25/75/75) editables pero con “reset a ley”.

2) Registro de tiempo (dos modos):
- Modo simple: el usuario ingresa totales por semana:
  - Horas trabajadas totales
  - Horas en festivos
  - Horas en domingos
  - Horas nocturnas (si aplica)
  - Horas extra (si ya las conoce)
- Modo detallado (recomendado): lista de “turnos”:
  - Fecha (YYYY-MM-DD)
  - Hora inicio (HH:mm)
  - Hora fin (HH:mm) (soportar cruces de medianoche)
  - Checkbox: “es festivo” (o autocalcular con lista local de festivos Colombia por año; si no, permitir manual)
  - Break opcional (minutos) o múltiples segmentos
La app debe partir automáticamente cada turno en bloques: diurno/nocturno y (normal vs extra) y (hábil vs domingo/festivo).

SALIDAS (RESULTADOS):
- Tabs: “Política interna” | “Ley colombiana” | “Comparación”
- Resumen con KPIs:
  - Horas normales
  - Horas colchón (37.5–40) (solo interno)
  - Horas extra
  - Horas nocturnas
  - Horas dominicales/festivas
  - Total $ a pagar (y/o adicional $)
- Tabla de desglose por día + por categoría (con multiplicador aplicado y valor)
- Comparación:
  - Diferencia $ (ley vs interno)
  - Alertas:
    - “Se registraron horas nocturnas: política interna no contempla recargo; riesgo de incumplimiento”
    - “Se registraron domingos: política interna indica no trabajar; si ocurrió, ley exige recargo”
    - “Festivo interno paga 2.0x vs ley 1.75x: estás pagando por encima (ok)”
- Sección “Pago atrasado”:
  - El usuario define frecuencia de nómina: semanal / quincenal / mensual
  - Define fecha de corte y fecha de pago
  - La app etiqueta cada turno con: “se paga en nómina #X (estimado)” y muestra el desfase (~15 días editable)

ARQUITECTURA / CÓDIGO:
- Crear un módulo puro TS: payrollEngine.ts
  - types: WorkEntry, SplitSegment, PolicyConfig, CalcResult
  - funciones deterministas:
    - splitEntryIntoSegments(entry, nocturnoStart=21:00, nocturnoEnd=06:00)
    - classifySegments(segments, weeklyContext, policy)
    - calcInternal(weekEntries, internalConfig)
    - calcColombia(weekEntries, legalConfig)
    - compareResults(internalResult, legalResult)
- Manejar cruces de medianoche correctamente.
- Redondeo configurable (por defecto: 2 decimales en dinero; 2 decimales en horas).
- Incluir 5 casos de prueba en comments (o con vitest si lo agregas):
  1) Semana 38h (todo diurno, no festivo): interno = todo normal; legal = todo normal.
  2) Semana 41h diurnas: interno = 40 normal + 1 a 1.5; legal = depende del límite configurado, mostrar ambos.
  3) Turno 20:00–23:00 entre semana: segmentar 1h diurna + 2h nocturnas, aplicar 1.35 en las nocturnas (si son ordinarias).
  4) Festivo 8h diurnas: interno 2.0x; legal 1.75x (mostrar total vs adicional).
  5) Domingo 22:00–02:00: nocturno + dominical, segmentar y pagar 2.10x (ordinaria nocturna dominical) o 2.50x si cae como extra, según reglas.

OUTPUT ESPERADO:
- Entrega el código completo de los componentes principales:
  - App layout
  - Form de configuración
  - Captura de turnos
  - Results dashboard con tablas
  - Export CSV
- Asegura estilos shadcn, responsive y accesible (labels, aria, focus).
- No uses backend, no uses auth. Todo local.
- Incluye un bloque final: “Notas legales” con las fórmulas y un disclaimer (informativo, no asesoría legal).


EJEMPLO DE CÓDIGO: 
<!DOCTYPE html>
<html lang="es">
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculadora de Nómina</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.plot.ly/plotly-3.1.1.min.js"></script>
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif']
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-50 font-sans">

<header id="header" class="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    <i class="fa-solid fa-calculator text-white text-lg"></i>
                </div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-900">Calculadora de Nómina</h1>
                    <p class="text-xs text-slate-500">Comparativa Colombia</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <button class="text-slate-600 hover:text-slate-900 transition-colors">
                    <i class="fa-regular fa-circle-question text-xl"></i>
                </button>
                <button class="text-slate-600 hover:text-slate-900 transition-colors">
                    <i class="fa-regular fa-bell text-xl"></i>
                </button>
                <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    US
                </div>
            </div>
        </div>
    </div>
</header>

<main id="main-content" class="max-w-7xl mx-auto px-6 py-8">
    
    <section id="hero-section" class="mb-8">
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-8 text-white">
            <div class="max-w-3xl">
                <h2 class="text-3xl font-bold mb-3">Calculadora de Horas Extra y Recargos</h2>
                <p class="text-slate-300 text-lg mb-6">Compara tu política interna vs. ley colombiana, sin inventar horas. Calcula de forma precisa recargos nocturnos, horas extras, dominicales y festivos.</p>
                <div class="flex flex-wrap gap-3">
                    <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <i class="fa-solid fa-shield-halved text-blue-400"></i>
                        <span class="text-sm">Conforme a ley colombiana 2025</span>
                    </div>
                    <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <i class="fa-solid fa-chart-line text-green-400"></i>
                        <span class="text-sm">Comparativa detallada</span>
                    </div>
                    <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <i class="fa-solid fa-file-export text-purple-400"></i>
                        <span class="text-sm">Exporta resultados</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="tabs-navigation" class="mb-8">
        <div class="bg-white rounded-xl border border-slate-200 p-1.5">
            <div class="flex space-x-1">
                <button id="tab-entradas" class="flex-1 px-6 py-3 rounded-lg bg-slate-900 text-white font-medium transition-all">
                    <i class="fa-solid fa-keyboard mr-2"></i>
                    Entradas
                </button>
                <button id="tab-resultados" class="flex-1 px-6 py-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
                    <i class="fa-solid fa-chart-bar mr-2"></i>
                    Resultados
                </button>
                <button id="tab-notas" class="flex-1 px-6 py-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
                    <i class="fa-solid fa-scale-balanced mr-2"></i>
                    Notas Legales
                </button>
            </div>
        </div>
    </section>

    <div id="content-entradas">
        
        <section id="datos-pago-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-money-bill-wave text-blue-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Datos de Pago</h3>
                            <p class="text-sm text-slate-500">Configure la información salarial base</p>
                        </div>
                    </div>
                    <button class="text-slate-400 hover:text-slate-600">
                        <i class="fa-solid fa-circle-info"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-3">Tipo de salario</label>
                        <div class="flex space-x-3">
                            <button class="flex-1 px-4 py-3 border-2 border-slate-900 bg-slate-900 text-white rounded-lg font-medium transition-all">
                                <i class="fa-solid fa-calendar-days mr-2"></i>
                                Mensual
                            </button>
                            <button class="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-lg font-medium hover:border-slate-300 transition-all">
                                <i class="fa-solid fa-clock mr-2"></i>
                                Por hora
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-3">Valor del salario</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                            <input type="text" placeholder="2.500.000" class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" value="2,500,000">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-3">Días trabajados por semana</label>
                        <div class="relative">
                            <select class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white">
                                <option>5 días (Lunes a Viernes)</option>
                                <option>6 días (Lunes a Sábado)</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-3">Visualización de resultados</label>
                        <div class="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-eye text-slate-600"></i>
                                <div>
                                    <p class="text-sm font-medium text-slate-900">Mostrar valor total</p>
                                    <p class="text-xs text-slate-500">vs. solo adicional</p>
                                </div>
                            </div>
                            <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-900 transition-colors">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="config-interna-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-building text-purple-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Configuración Interna</h3>
                            <p class="text-sm text-slate-500">Política de la empresa</p>
                        </div>
                    </div>
                    <button class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-all">
                        <i class="fa-solid fa-rotate-right mr-2"></i>
                        Restaurar valores
                    </button>
                </div>

                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div class="flex">
                        <i class="fa-solid fa-triangle-exclamation text-amber-600 mr-3 mt-0.5"></i>
                        <div>
                            <p class="text-sm font-medium text-amber-900 mb-1">Limitaciones de política interna</p>
                            <p class="text-sm text-amber-700">La política interna no contempla recargos nocturnos ni dominicales. Si aparecen estos turnos en el registro, se marcarán como alertas en los resultados.</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Horas base semanales</label>
                        <div class="relative">
                            <input type="number" value="37.5" step="0.5" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">horas</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1.5">Jornada ordinaria sin recargos</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Colchón hasta</label>
                        <div class="relative">
                            <input type="number" value="40" step="0.5" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">horas</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1.5">Límite antes de extras</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Multiplicador horas extra</label>
                        <div class="relative">
                            <input type="number" value="1.5" step="0.1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">x</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1.5">Horas superiores al colchón</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Multiplicador festivos</label>
                        <div class="relative">
                            <input type="number" value="2.0" step="0.1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">x</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1.5">Trabajo en días festivos</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="config-legal-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-scale-balanced text-green-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Configuración Ley Colombiana</h3>
                            <p class="text-sm text-slate-500">Parámetros legales vigentes 2025</p>
                        </div>
                    </div>
                    <button class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-all">
                        <i class="fa-solid fa-rotate-right mr-2"></i>
                        Restaurar a ley
                    </button>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div class="flex">
                        <i class="fa-solid fa-circle-info text-blue-600 mr-3 mt-0.5"></i>
                        <div>
                            <p class="text-sm font-medium text-blue-900 mb-1">Actualización jornada legal 2025</p>
                            <p class="text-sm text-blue-700">A partir del 15 de julio de 2025, la jornada semanal legal se reduce a 44 horas. El valor de la hora no puede disminuir con esta reducción.</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Límite semanal legal</label>
                        <div class="relative">
                            <select class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white">
                                <option>44 horas (desde 15-jul-2025)</option>
                                <option>42 horas (futura reducción)</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Horario nocturno</label>
                        <div class="flex space-x-3">
                            <div class="flex-1">
                                <input type="time" value="21:00" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <p class="text-xs text-slate-500 mt-1.5">Inicio</p>
                            </div>
                            <div class="flex-1">
                                <input type="time" value="06:00" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <p class="text-xs text-slate-500 mt-1.5">Fin</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="border-t border-slate-200 pt-6">
                    <h4 class="text-sm font-semibold text-slate-900 mb-4">Recargos y multiplicadores legales</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Recargo nocturno
                                <button class="ml-1.5 text-slate-400 hover:text-slate-600">
                                    <i class="fa-solid fa-circle-question text-xs"></i>
                                </button>
                            </label>
                            <div class="relative">
                                <input type="number" value="35" step="1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1.5">Trabajo entre 21:00 y 06:00</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Extra diurna
                                <button class="ml-1.5 text-slate-400 hover:text-slate-600">
                                    <i class="fa-solid fa-circle-question text-xs"></i>
                                </button>
                            </label>
                            <div class="relative">
                                <input type="number" value="25" step="1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1.5">Exceso jornada, horario diurno</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Extra nocturna
                                <button class="ml-1.5 text-slate-400 hover:text-slate-600">
                                    <i class="fa-solid fa-circle-question text-xs"></i>
                                </button>
                            </label>
                            <div class="relative">
                                <input type="number" value="75" step="1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1.5">Exceso jornada + nocturno</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                                Dominical / Festivo
                                <button class="ml-1.5 text-slate-400 hover:text-slate-600">
                                    <i class="fa-solid fa-circle-question text-xs"></i>
                                </button>
                            </label>
                            <div class="relative">
                                <input type="number" value="75" step="1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1.5">Trabajo en domingo o festivo</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="registro-tiempo-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-clock text-indigo-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Registro de Tiempo</h3>
                            <p class="text-sm text-slate-500">Ingrese las horas trabajadas</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm text-slate-600">Modo simple</span>
                        <button class="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                        </button>
                        <span class="text-sm font-medium text-slate-900">Modo detallado</span>
                    </div>
                </div>

                <div id="modo-detallado">
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-4">
                            <p class="text-sm text-slate-600">Registre cada turno trabajado con sus detalles específicos</p>
                            <button class="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                                <i class="fa-solid fa-plus mr-2"></i>
                                Agregar turno
                            </button>
                        </div>
                    </div>

                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fecha</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Inicio</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Fin</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Break (min)</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Festivo</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Notas</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200">
                                    <tr class="hover:bg-slate-50">
                                        <td class="px-4 py-3">
                                            <input type="date" value="2025-01-20" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="08:00" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="17:00" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="number" value="60" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="checkbox" class="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="text" placeholder="Opcional" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <button class="text-red-600 hover:text-red-700">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-slate-50">
                                        <td class="px-4 py-3">
                                            <input type="date" value="2025-01-21" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="08:00" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="18:30" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="number" value="60" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="checkbox" class="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="text" placeholder="Opcional" class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <button class="text-red-600 hover:text-red-700">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-slate-50 bg-amber-50">
                                        <td class="px-4 py-3">
                                            <input type="date" value="2025-01-22" class="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="22:00" class="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="time" value="06:00" class="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="number" value="30" class="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="checkbox" class="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900">
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="text" value="Turno nocturno" class="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                                        </td>
                                        <td class="px-4 py-3">
                                            <button class="text-red-600 hover:text-red-700">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
                        <i class="fa-solid fa-moon text-amber-600 mr-2 mt-0.5"></i>
                        <p class="text-sm text-amber-800">
                            <span class="font-medium">Turno cruza medianoche:</span> El turno del 22/01 inicia a las 22:00 y termina a las 06:00 del día siguiente. Se calculará automáticamente el recargo nocturno correspondiente.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="pago-atrasado-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-calendar-check text-orange-600"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Pago Atrasado</h3>
                            <p class="text-sm text-slate-500">Configure el ciclo de nómina y desfases</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Frecuencia de nómina</label>
                        <div class="relative">
                            <select class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent appearance-none bg-white">
                                <option>Semanal</option>
                                <option>Quincenal</option>
                                <option selected>Mensual</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Fecha de corte</label>
                        <input type="date" value="2025-01-31" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Fecha estimada de pago</label>
                        <input type="date" value="2025-02-05" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Desfase de pago (días)</label>
                        <div class="relative">
                            <input type="number" value="15" step="1" class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">días</span>
                        </div>
                    </div>
                </div>

                <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex">
                        <i class="fa-solid fa-lightbulb text-blue-600 mr-3 mt-0.5"></i>
                        <div>
                            <p class="text-sm font-medium text-blue-900 mb-1">Etiquetado automático</p>
                            <p class="text-sm text-blue-700">Cada turno se etiquetará automáticamente con el período de nómina donde se pagará, considerando el desfase configurado.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="calcular-section" class="mb-8">
            <div class="flex justify-center">
                <button class="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <i class="fa-solid fa-calculator mr-3"></i>
                    Calcular Comparativa
                </button>
            </div>
        </section>

    </div>

    <div id="content-resultados" class="hidden">
        
        <section id="kpi-cards-section" class="mb-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-building text-2xl"></i>
                        </div>
                        <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Interno</span>
                    </div>
                    <h4 class="text-sm font-medium mb-2 opacity-90">Total Política Interna</h4>
                    <p class="text-3xl font-bold mb-1">$2,847,500</p>
                    <p class="text-sm opacity-80">Base + extras + festivos</p>
                </div>

                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-scale-balanced text-2xl"></i>
                        </div>
                        <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Legal</span>
                    </div>
                    <h4 class="text-sm font-medium mb-2 opacity-90">Total Ley Colombiana</h4>
                    <p class="text-3xl font-bold mb-1">$3,125,750</p>
                    <p class="text-sm opacity-80">Incluye recargos nocturnos</p>
                </div>

                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-scale-unbalanced-flip text-2xl"></i>
                        </div>
                        <span class="text-sm font-medium bg-emerald-500 px-3 py-1 rounded-full">A favor empleado</span>
                    </div>
                    <h4 class="text-sm font-medium mb-2 opacity-90">Diferencia</h4>
                    <p class="text-3xl font-bold mb-1">$278,250</p>
                    <p class="text-sm opacity-80">+9.8% sobre política interna</p>
                </div>
            </div>
        </section>

        <section id="tabs-resultados-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-1.5">
                <div class="flex space-x-1">
                    <button class="flex-1 px-6 py-3 rounded-lg bg-slate-900 text-white font-medium transition-all">
                        <i class="fa-solid fa-building mr-2"></i>
                        Política Interna
                    </button>
                    <button class="flex-1 px-6 py-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i class="fa-solid fa-scale-balanced mr-2"></i>
                        Ley Colombiana
                    </button>
                    <button class="flex-1 px-6 py-3 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-all">
                        <i class="fa-solid fa-code-compare mr-2"></i>
                        Comparación
                    </button>
                </div>
            </div>
        </section>

        <section id="breakdown-section" class="mb-6">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-slate-900">Desglose por Categoría - Política Interna</h3>
                    <div class="flex space-x-3">
                        <button class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                            <i class="fa-solid fa-file-csv mr-2"></i>
                            Exportar CSV
                        </button>
                        <button class="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                            <i class="fa-solid fa-copy mr-2"></i>
                            Copiar resumen
                        </button>
                    </div>
                </div>

                <div class="border border-slate-200 rounded-lg overflow-hidden mb-6">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-semibold text-slate-700">Categoría</th>
                                <th class="px-6 py-4 text-right text-sm font-semibold text-slate-700">Horas</th>
                                <th class="px-6 py-4 text-right text-sm font-semibold text-slate-700">Tarifa/Hora</th>
                                <th class="px-6 py-4 text-right text-sm font-semibold text-slate-700">Subtotal</th>
                                <th class="px-6 py-4 text-right text-sm font-semibold text-slate-700">% Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            <tr class="hover:bg-slate-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-slate-400 rounded-full mr-3"></span>
                                        <span class="font-medium text-slate-900">Horas normales</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right text-slate-700">150.0</td>
                                <td class="px-6 py-4 text-right text-slate-700">$15,625</td>
                                <td class="px-6 py-4 text-right font-semibold text-slate-900">$2,343,750</td>
                                <td class="px-6 py-4 text-right text-slate-700">82.3%</td>
                            </tr>
                            <tr class="hover:bg-slate-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                                        <span class="font-medium text-slate-900">Horas colchón</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right text-slate-700">10.0</td>
                                <td class="px-6 py-4 text-right text-slate-700">$15,625</td>
                                <td class="px-6 py-4 text-right font-semibold text-slate-900">$156,250</td>
                                <td class="px-6 py-4 text-right text-slate-700">5.5%</td>
                            </tr>
                            <tr class="hover:bg-slate-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-orange-400 rounded-full mr-3"></span>
                                        <span class="font-medium text-slate-900">Horas extra</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right text-slate-700">9.5</td>
                                <td class="px-6 py-4 text-right text-slate-700">$23,438</td>
                                <td class="px-6 py-4 text-right font-semibold text-slate-900">$222,656</td>
                                <td class="px-6 py-4 text-right text-slate-700">7.8%</td>
                            </tr>
                            <tr class="hover:bg-slate-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <span class="w-3 h-3 bg-purple-400 rounded-full mr-3"></span>
                                        <span class="font-medium text-slate-900">Festivos</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right text-slate-700">8.0</td>
                                <td class="px-6 py-4 text-right text-slate-700">$31,250</td>
                                <td class="px-6 py-4 text-right font-semibold text-slate-900">$250,000</td>
                                <td class="px-6 py-4 text-right text-slate-700">8.8%</td>
                            </tr>
                            <tr class="bg-slate-50 font-semibold">
                                <td class="px-6 py-4 text-slate-900">Total</td>
                                <td class="px-6 py-4 text-right text-slate-900">177.5</td>
                                <td class="px-6 py-4 text-right text-slate-900">-</td>
                                <td class="px-6 py-4 text-right text-slate-900">$2,972,656</td>
                                <td class="px-6 py-4 text-right text-slate-900">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div id="chart-breakdown" style="height: 400px;" class="mb-6"></div>

                <div class="border-t border-slate-200 pt-6">
                    <h4 class="text-base font-semibold text-slate-900 mb-4">Detalle por Día</h4>
                    <div class="space-y-3">
                        <div class="border border-slate-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <p class="font-semibold text-slate-900">Lunes, 20 de Enero 2025</p>
                                    <p class="text-sm text-slate-500">08:00 - 17:00 (Break: 60 min)</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-slate-900">$125,000</p>
                                    <p class="text-sm text-slate-500">8.0 horas</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">DIURNO</span>
                                <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">NORMAL</span>
                            </div>
                        </div>

                        <div class="border border-slate-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <p class="font-semibold text-slate-900">Martes, 21 de Enero 2025</p>
                                    <p class="text-sm text-slate-500">08:00 - 18:30 (Break: 60 min)</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-slate-900">$148,438</p>
                                    <p class="text-sm text-slate-500">9.5 horas</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">DIURNO</span>
                                <span class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">EXTRA 1.5h</span>
                            </div>
                        </div>

                        <div class="border border-amber-200 bg-amber-50 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <p class="font-semibold text-slate-900">Miércoles, 22 de Enero 2025</p>
                                    <p class="text-sm text-slate-500">22:00 - 06:00 (Break: 30 min)</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-slate-900">$117,188</p>
                                    <p class="text-sm text-slate-500">7.5 horas</p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">NOCTURNO</span>
                                <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">⚠ NO PAGO NOCTURNO</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="alertas-section" class="mb-8">
            <div class="space-y-4">
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <h4 class="text-lg font-semibold text-amber-900 mb-2">Horas nocturnas detectadas</h4>
                            <p class="text-amber-800 mb-3">La política interna no contempla pago de recargo nocturno. Sin embargo, la ley colombiana exige un recargo del 35% para trabajo entre las 21:00 y 06:00.</p>
                            <div class="bg-white rounded-lg p-4 border border-amber-200">
                                <p class="text-sm font-medium text-slate-900 mb-2">Turnos afectados:</p>
                                <ul class="space-y-1 text-sm text-slate-700">
                                    <li>• Miércoles 22/01: 7.5 horas nocturnas - Diferencia: $82,031</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fa-solid fa-circle-info text-blue-600 text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <h4 class="text-lg font-semibold text-blue-900 mb-2">Recomendación legal</h4>
                            <p class="text-blue-800">Se recomienda ajustar la política interna para incluir el recargo nocturno del 35% y cumplir con la legislación laboral colombiana vigente.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </div>

    <div id="content-notas" class="hidden">
        
        <section id="notas-legales-section" class="mb-8">
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-book-open text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-slate-900">Notas Legales y Conceptos</h3>
                        <p class="text-sm text-slate-500">Información sobre la legislación laboral colombiana</p>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <button class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-moon text-indigo-600"></i>
                                <span class="font-semibold text-slate-900">¿Qué es hora nocturna?</span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-slate-400"></i>
                        </button>
                        <div class="px-6 py-5 border-t border-slate-200">
                            <p class="text-slate-700 mb-4">El trabajo nocturno se define como aquel realizado entre las 21:00 horas (9:00 PM) y las 06:00 horas (6:00 AM) del día siguiente.</p>
                            
                            <div class="bg-slate-50 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-slate-900 mb-2">Fórmula de cálculo:</p>
                                <code class="text-sm text-slate-700 bg-white px-2 py-1 rounded">Valor hora nocturna = Valor hora ordinaria × 1.35</code>
                            </div>

                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p class="text-sm font-semibold text-blue-900 mb-2">Ejemplo práctico:</p>
                                <p class="text-sm text-blue-800">Si tu salario base es $2,500,000 mensuales y trabajas 8 horas en horario nocturno (22:00 a 06:00), el cálculo sería:</p>
                                <ul class="mt-2 space-y-1 text-sm text-blue-800">
                                    <li>• Valor hora ordinaria: $15,625</li>
                                    <li>• Recargo nocturno 35%: $5,469</li>
                                    <li>• Valor hora nocturna: $21,094</li>
                                    <li>• Total por 8 horas: $168,750</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <button class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-clock text-orange-600"></i>
                                <span class="font-semibold text-slate-900">Recargo nocturno vs. Hora extra nocturna</span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-slate-400"></i>
                        </button>
                        <div class="px-6 py-5 border-t border-slate-200 hidden">
                            <p class="text-slate-700 mb-4">Es importante distinguir entre el recargo nocturno (trabajo en horario nocturno dentro de la jornada ordinaria) y la hora extra nocturna (trabajo nocturno que excede la jornada legal).</p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p class="text-sm font-semibold text-indigo-900 mb-2">Recargo nocturno (35%)</p>
                                    <p class="text-sm text-indigo-800">Trabajo nocturno dentro de las 44 horas semanales legales.</p>
                                    <code class="text-xs text-indigo-700 bg-white px-2 py-1 rounded mt-2 inline-block">Valor hora × 1.35</code>
                                </div>
                                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <p class="text-sm font-semibold text-purple-900 mb-2">Extra nocturna (75%)</p>
                                    <p class="text-sm text-purple-800">Trabajo nocturno que excede la jornada legal semanal.</p>
                                    <code class="text-xs text-purple-700 bg-white px-2 py-1 rounded mt-2 inline-block">Valor hora × 1.75</code>
                                </div>
                            </div>

                            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p class="text-sm font-semibold text-amber-900 mb-2">Ejemplo comparativo:</p>
                                <p class="text-sm text-amber-800 mb-2">Trabajador con valor hora de $15,625:</p>
                                <ul class="space-y-1 text-sm text-amber-800">
                                    <li>• Hora ordinaria diurna: $15,625</li>
                                    <li>• Hora nocturna (recargo 35%): $21,094</li>
                                    <li>• Hora extra nocturna (75%): $27,344</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <button class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-calendar-day text-green-600"></i>
                                <span class="font-semibold text-slate-900">Dominical y festivo</span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-slate-400"></i>
                        </button>
                        <div class="px-6 py-5 border-t border-slate-200 hidden">
                            <p class="text-slate-700 mb-4">El trabajo en domingo o día festivo tiene un recargo del 75% sobre el valor de la hora ordinaria, además de otorgar derecho a un día compensatorio remunerado.</p>
                            
                            <div class="bg-slate-50 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-slate-900 mb-2">Fórmula de cálculo:</p>
                                <code class="text-sm text-slate-700 bg-white px-2 py-1 rounded">Valor hora dominical/festiva = Valor hora ordinaria × 1.75</code>
                            </div>

                            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-green-900 mb-2">Derechos adicionales:</p>
                                <ul class="space-y-1 text-sm text-green-800">
                                    <li>• Recargo del 75% sobre el valor de la hora</li>
                                    <li>• Día compensatorio remunerado</li>
                                    <li>• Si el festivo coincide con domingo, aplica el mismo recargo</li>
                                </ul>
                            </div>

                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p class="text-sm font-semibold text-blue-900 mb-2">Ejemplo práctico:</p>
                                <p class="text-sm text-blue-800">Trabajador con salario de $2,500,000 que labora 8 horas un domingo:</p>
                                <ul class="mt-2 space-y-1 text-sm text-blue-800">
                                    <li>• Valor hora ordinaria: $15,625</li>
                                    <li>• Recargo dominical 75%: $11,719</li>
                                    <li>• Valor hora dominical: $27,344</li>
                                    <li>• Total por 8 horas: $218,750</li>
                                    <li>• + 1 día compensatorio remunerado</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <button class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-business-time text-purple-600"></i>
                                <span class="font-semibold text-slate-900">Jornada semanal legal 2025 y reducción gradual</span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-slate-400"></i>
                        </button>
                        <div class="px-6 py-5 border-t border-slate-200 hidden">
                            <p class="text-slate-700 mb-4">La Ley 2101 de 2021 establece una reducción gradual de la jornada laboral máxima legal en Colombia, sin que esto implique una disminución en el salario de los trabajadores.</p>
                            
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-purple-900 mb-3">Cronograma de reducción:</p>
                                <div class="space-y-2">
                                    <div class="flex justify-between items-center p-2 bg-white rounded">
                                        <span class="text-sm text-slate-700">Hasta 14 de julio 2023</span>
                                        <span class="font-semibold text-slate-900">48 horas</span>
                                    </div>
                                    <div class="flex justify-between items-center p-2 bg-white rounded">
                                        <span class="text-sm text-slate-700">15 julio 2023 - 14 julio 2024</span>
                                        <span class="font-semibold text-slate-900">47 horas</span>
                                    </div>
                                    <div class="flex justify-between items-center p-2 bg-white rounded">
                                        <span class="text-sm text-slate-700">15 julio 2024 - 14 julio 2025</span>
                                        <span class="font-semibold text-slate-900">46 horas</span>
                                    </div>
                                    <div class="flex justify-between items-center p-2 bg-purple-100 rounded">
                                        <span class="text-sm font-semibold text-purple-900">Desde 15 julio 2025</span>
                                        <span class="font-bold text-purple-900">44 horas</span>
                                    </div>
                                    <div class="flex justify-between items-center p-2 bg-white rounded">
                                        <span class="text-sm text-slate-700">Desde 15 julio 2026</span>
                                        <span class="font-semibold text-slate-900">42 horas</span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-amber-900 mb-2">⚠️ Protección salarial:</p>
                                <p class="text-sm text-amber-800">El valor de la hora de trabajo NO puede disminuir como consecuencia de la reducción de la jornada. Si un trabajador ganaba cierto valor por hora con jornada de 48 horas, ese valor debe mantenerse o aumentar con la nueva jornada reducida.</p>
                            </div>

                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p class="text-sm font-semibold text-blue-900 mb-2">Ejemplo de protección salarial:</p>
                                <p class="text-sm text-blue-800 mb-2">Trabajador con salario mensual de $2,500,000:</p>
                                <ul class="space-y-1 text-sm text-blue-800">
                                    <li>• Con jornada 48h/semana: Valor hora = $13,021</li>
                                    <li>• Con jornada 44h/semana: Valor hora = $14,205 (mínimo)</li>
                                    <li>• El salario mensual debe mantenerse en $2,500,000 o superior</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <button class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fa-solid fa-calculator text-teal-600"></i>
                                <span class="font-semibold text-slate-900">Cálculo del valor de la hora</span>
                            </div>
                            <i class="fa-solid fa-chevron-down text-slate-400"></i>
                        </button>
                        <div class="px-6 py-5 border-t border-slate-200 hidden">
                            <p class="text-slate-700 mb-4">El valor de la hora ordinaria se calcula dividiendo el salario mensual entre el número de horas trabajadas en el mes, considerando la jornada legal vigente.</p>
                            
                            <div class="bg-slate-50 rounded-lg p-4 mb-4">
                                <p class="text-sm font-semibold text-slate-900 mb-2">Fórmula básica (jornada 44h desde julio 2025):</p>
                                <code class="text-sm text-slate-700 bg-white px-2 py-1 rounded block mb-2">Valor hora = Salario mensual / (44 horas × 4.33 semanas)</code>
                                <code class="text-sm text-slate-700 bg-white px-2 py-1 rounded block">Valor hora = Salario mensual / 190.52 horas</code>
                            </div>

                            <div class="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                <p class="text-sm font-semibold text-teal-900 mb-2">Ejemplo detallado:</p>
                                <p class="text-sm text-teal-800 mb-2">Salario mensual: $2,500,000</p>
                                <ul class="space-y-1 text-sm text-teal-800">
                                    <li>• Horas mensuales: 44 × 4.33 = 190.52 horas</li>
                                    <li>• Valor hora ordinaria: $2,500,000 / 190.52 = $13,119</li>
                                    <li>• Hora extra diurna (125%): $16,399</li>
                                    <li>• Hora nocturna (135%): $17,711</li>
                                    <li>• Hora extra nocturna (175%): $22,958</li>
                                    <li>• Hora dominical/festiva (175%): $22,958</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fa-solid fa-shield-halved text-red-600 text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <h4 class="text-lg font-semibold text-red-900 mb-2">Disclaimer Legal</h4>
                            <p class="text-red-800 mb-3">Esta calculadora es una herramienta informativa y educativa. Los cálculos presentados se basan en la legislación laboral colombiana vigente, pero pueden no contemplar todas las situaciones particulares o cambios normativos recientes.</p>
                            <p class="text-red-800 font-medium">Se recomienda validar todos los cálculos con su departamento de nómina, contador o asesor legal antes de tomar decisiones basadas en esta información.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </div>

</main>

<footer id="footer" class="bg-white border-t border-slate-200 mt-16">
    <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
                <div class="flex items-center space-x-2 mb-4">
                    <div class="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-calculator text-white"></i>
                    </div>
                    <span class="font-bold text-slate-900">Calculadora Nómina</span>
                </div>
                <p class="text-sm text-slate-600">Herramienta comparativa de nómina conforme a la legislación laboral colombiana.</p>
            </div>
            <div>
                <h4 class="font-semibold text-slate-900 mb-3">Recursos</h4>
                <ul class="space-y-2 text-sm text-slate-600">
                    <li><a href="#" class="hover:text-slate-900">Documentación</a></li>
                    <li><a href="#" class="hover:text-slate-900">Guía de uso</a></li>
                    <li><a href="#" class="hover:text-slate-900">Preguntas frecuentes</a></li>
                    <li><a href="#" class="hover:text-slate-900">Legislación vigente</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-slate-900 mb-3">Legal</h4>
                <ul class="space-y-2 text-sm text-slate-600">
                    <li><a href="#" class="hover:text-slate-900">Términos de uso</a></li>
                    <li><a href="#" class="hover:text-slate-900">Política de privacidad</a></li>
                    <li><a href="#" class="hover:text-slate-900">Disclaimer</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold text-slate-900 mb-3">Contacto</h4>
                <ul class="space-y-2 text-sm text-slate-600">
                    <li><a href="#" class="hover:text-slate-900">Soporte técnico</a></li>
                    <li><a href="#" class="hover:text-slate-900">Reportar error</a></li>
                    <li><a href="#" class="hover:text-slate-900">Sugerencias</a></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p class="text-sm text-slate-500">© 2025 Calculadora de Nómina. Todos los derechos reservados.</p>
            <div class="flex space-x-4 mt-4 md:mt-0">
                <a href="#" class="text-slate-400 hover:text-slate-600">
                    <i class="fa-brands fa-twitter"></i>
                </a>
                <a href="#" class="text-slate-400 hover:text-slate-600">
                    <i class="fa-brands fa-linkedin"></i>
                </a>
                <a href="#" class="text-slate-400 hover:text-slate-600">
                    <i class="fa-brands fa-github"></i>
                </a>
            </div>
        </div>
    </div>
</footer>

<script>
window.addEventListener('load', function() {
    try {
        var data = [{
            values: [82.3, 5.5, 7.8, 8.8],
            labels: ['Horas normales', 'Horas colchón', 'Horas extra', 'Festivos'],
            type: 'pie',
            marker: {
                colors: ['#94a3b8', '#60a5fa', '#fb923c', '#a78bfa']
            },
            textinfo: 'label+percent',
            textposition: 'outside',
            automargin: true
        }];

        var layout = {
            title: {
                text: 'Distribución de Horas - Política Interna',
                font: { size: 16, color: '#0f172a' }
            },
            showlegend: true,
            legend: {
                orientation: 'h',
                y: -0.2
            },
            margin: { t: 60, r: 20, b: 80, l: 20 },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff'
        };

        var config = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false
        };

        Plotly.newPlot('chart-breakdown', data, layout, config);
    } catch(e) {
        document.getElementById('chart-breakdown').innerHTML = '<div class="flex items-center justify-center h-full text-slate-500"><i class="fa-solid fa-chart-pie mr-2"></i> Gráfico no disponible</div>';
    }
});
</script>

</body>
</html>