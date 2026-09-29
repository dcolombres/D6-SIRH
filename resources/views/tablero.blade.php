@extends('layouts.app')

@section('title', 'Tablero')
@section('header', 'D6 · Tablero SIRH')

@section('header-actions')
<a href="{{ route('modulos') }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-secondary hover:bg-surface-container-high text-[10px] font-bold uppercase mr-2">
    <span class="material-symbols-outlined text-sm">edit</span> Editar módulos
</a>
<button type="button" onclick="window.print()" class="p-2 rounded-lg border border-outline-variant hover:bg-surface-container mr-1" title="Imprimir">
    <span class="material-symbols-outlined text-sm">print</span>
</button>
@endsection

@section('content')
<div class="max-w-[1400px] mx-auto space-y-6" x-data="tableroApp(@js($rowsJson), @js($catalogs))" x-init="init()">
    <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-primary">Tablero</p>
            <h1 class="text-2xl font-bold">Estado de módulos SIRH</h1>
            <p class="text-sm text-on-surface-variant">Avance, riesgos y plazos — desde MySQL.</p>
            <p class="text-[10px] font-data text-on-surface-variant mt-1" x-text="filtered.length + ' módulos'"></p>
        </div>
        <button type="button" @click="reset()" class="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold uppercase">Restablecer filtros</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input type="search" x-model="q" placeholder="Buscar…" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
        <select x-model="estado" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
            <option value="">Todos los estados</option>
            <template x-for="e in catalogs.estados" :key="e"><option :value="e" x-text="e"></option></template>
        </select>
        <select x-model="prioridad" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
            <option value="">Todas las prioridades</option>
            <template x-for="e in catalogs.prioridades" :key="e"><option :value="e" x-text="e"></option></template>
        </select>
        <select x-model="area" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
            <option value="">Todas las áreas</option>
            <template x-for="a in catalogs.areas" :key="a.id"><option :value="a.id" x-text="a.label"></option></template>
        </select>
        <select x-model="riesgo" class="px-4 py-3 bg-surface-container rounded-xl border-none text-sm">
            <option value="">Todos los riesgos</option>
            <template x-for="e in catalogs.riesgos" :key="e"><option :value="e" x-text="e"></option></template>
        </select>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <template x-for="k in kpis" :key="k.label">
            <div class="bg-white border border-outline-variant rounded-2xl p-4">
                <p class="text-[10px] font-bold uppercase text-on-surface-variant" x-text="k.label"></p>
                <p class="text-2xl font-bold font-data" x-text="k.value"></p>
            </div>
        </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h3 class="text-sm font-bold uppercase mb-3">Estados</h3>
            <canvas id="tablero-chart-estado" height="220"></canvas>
        </div>
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h3 class="text-sm font-bold uppercase mb-3">Avance</h3>
            <canvas id="tablero-chart-avance" height="220"></canvas>
        </div>
    </div>

    <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-surface-container-low text-[10px] uppercase text-on-surface-variant">
                    <tr>
                        <th class="text-left px-4 py-3">Módulo</th>
                        <th class="text-left px-3 py-3">Área</th>
                        <th class="text-left px-3 py-3">Estado</th>
                        <th class="text-left px-3 py-3">Avance</th>
                        <th class="text-left px-3 py-3">Riesgo</th>
                        <th class="text-left px-3 py-3">Fin prev.</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="r in filtered" :key="r.id">
                        <tr class="border-t border-outline-variant/50">
                            <td class="px-4 py-3 font-semibold" x-text="r.modulo"></td>
                            <td class="px-3 py-3 text-xs" x-text="areaLabel(r.area)"></td>
                            <td class="px-3 py-3 text-xs" x-text="r.estado"></td>
                            <td class="px-3 py-3 font-data text-xs" x-text="r.avance+'%'"></td>
                            <td class="px-3 py-3 text-xs" x-text="r.riesgo"></td>
                            <td class="px-3 py-3 text-xs font-data" x-text="r.fecha_fin_prevista || '—'"></td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
