@extends('layouts.app')

@section('title', 'Informe')
@section('header', 'D6 · Informe Gerencial')

@section('header-actions')
<button type="button" onclick="window.print()" class="p-2 rounded-lg bg-primary text-white mr-1" title="PDF / Imprimir">
    <span class="material-symbols-outlined text-sm">picture_as_pdf</span>
</button>
@endsection

@section('content')
<div class="max-w-4xl mx-auto bg-white border border-outline-variant rounded-2xl p-8 space-y-8 informe-print">
    <header>
        <p class="text-[10px] font-bold uppercase tracking-widest text-primary">Informe gerencial</p>
        <h1 class="text-3xl font-bold">{{ $brand['appTitle'] ?? 'D6' }} · SIRH</h1>
        <p class="text-sm text-on-surface-variant mt-1">{{ now()->format('d/m/Y H:i') }} · {{ $stats['total'] }} módulos activos</p>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface-container-low rounded-xl p-4">
            <p class="text-[10px] uppercase font-bold text-on-surface-variant">Total</p>
            <p class="text-2xl font-data font-bold">{{ $stats['total'] }}</p>
        </div>
        <div class="bg-surface-container-low rounded-xl p-4">
            <p class="text-[10px] uppercase font-bold text-on-surface-variant">Avance medio</p>
            <p class="text-2xl font-data font-bold">{{ $stats['avanceMedio'] }}%</p>
        </div>
        <div class="bg-surface-container-low rounded-xl p-4">
            <p class="text-[10px] uppercase font-bold text-on-surface-variant">Riesgo alto</p>
            <p class="text-2xl font-data font-bold">{{ $stats['riesgoAlto'] }}</p>
        </div>
        <div class="bg-surface-container-low rounded-xl p-4">
            <p class="text-[10px] uppercase font-bold text-on-surface-variant">Vencidos</p>
            <p class="text-2xl font-data font-bold">{{ $stats['vencidos'] }}</p>
        </div>
    </div>

    <section>
        <h2 class="text-sm font-bold uppercase tracking-widest mb-3">Detalle por módulo</h2>
        <table class="w-full text-sm">
            <thead class="text-[10px] uppercase text-on-surface-variant border-b">
                <tr>
                    <th class="text-left py-2">Módulo</th>
                    <th class="text-left py-2">Área</th>
                    <th class="text-left py-2">Estado</th>
                    <th class="text-left py-2">Avance</th>
                    <th class="text-left py-2">Riesgo</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $r)
                <tr class="border-b border-outline-variant/40">
                    <td class="py-2 font-semibold">{{ $r->modulo }}</td>
                    <td class="py-2 text-xs">{{ $r->areaLabel() }}</td>
                    <td class="py-2 text-xs">{{ $r->estado }}</td>
                    <td class="py-2 font-data text-xs">{{ $r->avance }}%</td>
                    <td class="py-2 text-xs">{{ $r->riesgo }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </section>
</div>
@endsection
