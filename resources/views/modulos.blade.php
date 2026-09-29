@extends('layouts.app')

@section('title', 'Módulos')
@section('header', 'D6 · Módulos SIRH')

@section('header-actions')
<a href="{{ route('tablero') }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase mr-2">
    <span class="material-symbols-outlined text-sm">analytics</span> Ver Tablero
</a>
@endsection

@section('content')
<div class="max-w-[1400px] mx-auto space-y-6"
     x-data="modulosApp(@js($rowsJson), @js($catalogs), @js($initialArea))"
     x-init="init()">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-primary">Catálogo unificado</p>
            <h1 class="text-2xl font-bold">Módulos SIRH</h1>
            <p class="text-sm text-on-surface-variant">Agregá, editá o desactivá módulos. Hoy y Tablero leen esta misma lista.</p>
        </div>
        <button type="button" @click="openForm()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase" x-show="view==='modulos'">
            <span class="material-symbols-outlined text-sm">add</span> Nuevo módulo
        </button>
    </div>

    <div class="flex flex-wrap gap-2">
        <template x-for="t in [['modulos','Catálogo'],['equipo','Equipo'],['proveedores','Proveedores']]" :key="t[0]">
            <button type="button" @click="view=t[0]"
                    class="px-4 py-2 rounded-xl text-xs font-bold uppercase"
                    :class="view===t[0] ? 'bg-primary text-white' : 'border border-outline-variant hover:bg-surface-container'"
                    x-text="t[1]"></button>
        </template>
    </div>

    <div x-show="view==='modulos'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="search" x-model="q" placeholder="Buscar…" class="md:col-span-2 px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
            <select x-model="area" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                <option value="">Todas las áreas</option>
                <template x-for="a in catalogs.areas" :key="a.id"><option :value="a.id" x-text="a.label"></option></template>
            </select>
            <select x-model="activo" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                <option value="">Activos e inactivos</option>
                <option value="1">Solo activos</option>
                <option value="0">Solo inactivos</option>
            </select>
        </div>

        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant">
                        <tr>
                            <th class="text-left px-4 py-3">Módulo</th>
                            <th class="text-left px-3 py-3">Área</th>
                            <th class="text-left px-3 py-3">Estado</th>
                            <th class="text-left px-3 py-3">Avance</th>
                            <th class="text-left px-3 py-3">Responsable</th>
                            <th class="text-left px-3 py-3">Proveedor</th>
                            <th class="text-right px-4 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template x-for="r in filtered" :key="r.id">
                            <tr class="border-t border-outline-variant/50 hover:bg-surface-container-low/60" :class="Number(r.activo)===0 && 'opacity-50'">
                                <td class="px-4 py-3">
                                    <div class="font-semibold" x-text="r.modulo"></div>
                                    <div class="text-[11px] text-on-surface-variant" x-text="r.descripcion || r.fase || '—'"></div>
                                </td>
                                <td class="px-3 py-3 text-xs" x-text="areaLabel(r.area)"></td>
                                <td class="px-3 py-3 text-xs" x-text="r.estado"></td>
                                <td class="px-3 py-3 font-data text-xs" x-text="r.avance + '%'"></td>
                                <td class="px-3 py-3 text-xs" x-text="r.responsable || '—'"></td>
                                <td class="px-3 py-3 text-xs" x-text="r.proveedor || '—'"></td>
                                <td class="px-4 py-3 text-right space-x-1">
                                    <button type="button" @click="openForm(r)" class="p-1.5 rounded-lg hover:bg-surface-container" title="Editar"><span class="material-symbols-outlined text-sm">edit</span></button>
                                    <button type="button" @click="toggleActivo(r)" class="p-1.5 rounded-lg hover:bg-surface-container" title="Activar/Desactivar"><span class="material-symbols-outlined text-sm">power_settings_new</span></button>
                                    <button type="button" @click="remove(r)" class="p-1.5 rounded-lg hover:bg-error/10 text-error" title="Eliminar"><span class="material-symbols-outlined text-sm">delete</span></button>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            <p class="px-4 py-3 text-xs text-on-surface-variant border-t" x-text="filtered.length + ' módulos'"></p>
        </div>
    </div>

    <div x-show="view==='equipo'" class="space-y-4" x-cloak>
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h2 class="text-lg font-bold mb-1">Agregar persona a un módulo</h2>
            <form class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end" @submit.prevent="addPerson()">
                <select x-model="add.modId" required class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                    <option value="">Módulo…</option>
                    <template x-for="r in rows" :key="'e'+r.id"><option :value="r.id" x-text="r.modulo"></option></template>
                </select>
                <input x-model="add.name" required placeholder="Persona" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                <select x-model="add.rol" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                    <option value="equipo">Equipo</option>
                    <option value="responsable">Responsable</option>
                </select>
                <button type="submit" class="px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase">Agregar</button>
            </form>
        </div>
        <div class="bg-white border border-outline-variant rounded-2xl p-5 space-y-3">
            <template x-for="p in teamAgg" :key="p.name">
                <div class="border border-outline-variant rounded-xl p-4">
                    <p class="font-bold" x-text="p.name"></p>
                    <p class="text-[11px] text-on-surface-variant" x-text="p.roles.join(' · ')"></p>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                        <template x-for="m in p.modules" :key="m.id">
                            <button type="button" @click="openForm(rows.find(x=>x.id===m.id))" class="text-[11px] px-2 py-1 rounded-lg bg-surface-container" x-text="m.modulo"></button>
                        </template>
                    </div>
                </div>
            </template>
        </div>
    </div>

    <div x-show="view==='proveedores'" class="space-y-4" x-cloak>
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h2 class="text-lg font-bold mb-1">Asignar proveedor</h2>
            <form class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" @submit.prevent="addProvider()">
                <select x-model="addProv.modId" required class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                    <option value="">Módulo…</option>
                    <template x-for="r in rows" :key="'p'+r.id"><option :value="r.id" x-text="r.modulo"></option></template>
                </select>
                <input x-model="addProv.name" required placeholder="Proveedor" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                <button type="submit" class="px-4 py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase">Asignar</button>
            </form>
        </div>
        <div class="bg-white border border-outline-variant rounded-2xl p-5 space-y-3">
            <template x-for="p in provAgg" :key="p.name">
                <div class="border border-outline-variant rounded-xl p-4">
                    <p class="font-bold" x-text="p.name"></p>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                        <template x-for="m in p.modules" :key="m.id">
                            <button type="button" @click="openForm(rows.find(x=>x.id===m.id))" class="text-[11px] px-2 py-1 rounded-lg bg-surface-container" x-text="m.modulo"></button>
                        </template>
                    </div>
                </div>
            </template>
        </div>
    </div>

    {{-- Modal --}}
    <div x-show="modal" x-cloak class="fixed inset-0 z-[110]">
        <div class="absolute inset-0 bg-black/40" @click="modal=false"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-bold" x-text="form.id ? 'Editar: '+form.modulo : 'Nuevo módulo'"></h3>
                <button type="button" @click="modal=false" class="p-2 rounded-full hover:bg-surface-container"><span class="material-symbols-outlined">close</span></button>
            </div>
            <form class="p-6 overflow-y-auto space-y-3" @submit.prevent="save()">
                <input required x-model="form.modulo" placeholder="Nombre *" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                <input x-model="form.descripcion" placeholder="Descripción" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                <div class="grid grid-cols-2 gap-3">
                    <select x-model="form.area" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                        <template x-for="a in catalogs.areas" :key="a.id"><option :value="a.id" x-text="a.label"></option></template>
                    </select>
                    <select x-model="form.estado" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                        <template x-for="e in catalogs.estados" :key="e"><option :value="e" x-text="e"></option></template>
                    </select>
                    <select x-model="form.prioridad" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                        <template x-for="e in catalogs.prioridades" :key="e"><option :value="e" x-text="e"></option></template>
                    </select>
                    <select x-model="form.riesgo" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
                        <template x-for="e in catalogs.riesgos" :key="e"><option :value="e" x-text="e"></option></template>
                    </select>
                    <input type="number" min="0" max="100" x-model.number="form.avance" placeholder="Avance %" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                    <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.activoBool"/> Activo</label>
                    <input x-model="form.responsable" placeholder="Responsable" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                    <input x-model="form.proveedor" placeholder="Proveedor" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
                </div>
                <textarea x-model="form.equipo" rows="3" placeholder="Equipo (una persona por línea)" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"></textarea>
                <div class="flex justify-end gap-2">
                    <button type="button" @click="modal=false" class="px-4 py-2 rounded-xl border text-xs font-bold uppercase">Cancelar</button>
                    <button type="submit" class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
