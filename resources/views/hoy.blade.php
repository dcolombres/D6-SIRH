@extends('layouts.app')

@section('title', 'Hoy')
@section('header', 'D6 · Hoy')

@section('content')
<div class="max-w-[1400px] mx-auto space-y-8">
    <div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Vista del catálogo</p>
        <h1 class="text-3xl font-bold">Hoy</h1>
        <p class="text-on-surface-variant text-sm">Qué requiere atención ahora (módulos activos)</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @foreach([
            ['Módulos SIRH', $stats['total'], 'view_module', 'emerald'],
            ['Riesgo alto', $stats['riesgoAlto'], 'warning', 'error'],
            ['Avance medio', $stats['avanceMedio'].'%', 'rocket_launch', 'primary'],
            ['Vencidos', $stats['vencidos'], 'event_busy', 'amber'],
        ] as [$label, $val, $icon])
        <div class="bg-white border border-outline-variant rounded-2xl p-6 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl text-primary">{{ $icon }}</span>
            </div>
            <div>
                <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{{ $label }}</p>
                <h3 class="text-3xl font-bold font-data">{{ $val }}</h3>
            </div>
        </div>
        @endforeach
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h3 class="text-sm font-bold uppercase tracking-widest mb-3">Estados</h3>
            <canvas id="chart-estado" height="200"></canvas>
        </div>
        <div class="bg-white border border-outline-variant rounded-2xl p-5">
            <h3 class="text-sm font-bold uppercase tracking-widest mb-3">Foco</h3>
            <div class="space-y-2">
                @forelse($focus as $item)
                    <a href="{{ route('modulos') }}" class="block border border-outline-variant rounded-xl p-3 hover:bg-surface-container-low">
                        <div class="font-semibold">{{ $item->modulo }}</div>
                        <div class="text-xs text-on-surface-variant">{{ $item->estado }} · Riesgo {{ $item->riesgo }} · {{ $item->avance }}%</div>
                    </a>
                @empty
                    <p class="text-sm text-on-surface-variant italic">Sin ítems de foco.</p>
                @endforelse
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
window.__D6_HOY__ = @json(['byEstado' => $stats['byEstado']]);
</script>
@endpush
