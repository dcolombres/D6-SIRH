@extends('layouts.app')

@section('title', 'Admin')
@section('header', 'D6 · Admin')

@section('content')
<div class="max-w-3xl mx-auto space-y-6" x-data="adminApp()">
    <div>
        <h1 class="text-2xl font-bold">Administración</h1>
        <p class="text-sm text-on-surface-variant">Marca y resguardo de datos. {{ $count }} módulos en catálogo.</p>
    </div>

    <form method="post" action="{{ route('admin.brand') }}" class="bg-white border border-outline-variant rounded-2xl p-6 space-y-4">
        @csrf
        <h2 class="text-lg font-bold flex items-center gap-2"><span class="material-symbols-outlined">palette</span> Identidad y marca</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] font-bold uppercase mb-1">Título</label>
                <input name="appTitle" value="{{ $brand['appTitle'] ?? 'D6' }}" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
            </div>
            <div>
                <label class="block text-[10px] font-bold uppercase mb-1">Color primario</label>
                <input type="color" name="primaryColor" value="{{ $brand['primaryColor'] ?? '#111111' }}" class="w-full h-12 bg-surface-container rounded-xl border-none"/>
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold uppercase mb-1">Subtítulo</label>
                <input name="appSubtitle" value="{{ $brand['appSubtitle'] ?? '' }}" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold uppercase mb-1">Operador</label>
                <input name="operatorName" value="{{ $brand['operatorName'] ?? '' }}" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-sm"/>
            </div>
            <div class="md:col-span-2">
                <label class="block text-[10px] font-bold uppercase mb-1">CSS personalizado</label>
                <textarea name="customCSS" rows="6" class="w-full px-4 py-3 bg-surface-container rounded-xl border-none text-xs font-data">{{ $brand['customCSS'] ?? '' }}</textarea>
            </div>
        </div>
        <button type="submit" class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase">Guardar marca</button>
    </form>

    <section class="bg-white border border-outline-variant rounded-2xl p-6 space-y-4">
        <h2 class="text-lg font-bold flex items-center gap-2"><span class="material-symbols-outlined">sync</span> Centro de Datos</h2>
        <p class="text-sm text-on-surface-variant">Exportá / importá el paquete JSON (módulos + marca). Un nivel de deshacer tras import.</p>
        <div class="flex flex-wrap gap-2">
            <button type="button" @click="exportBackup()" class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase">Exportar paquete</button>
            <label class="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold uppercase cursor-pointer hover:bg-surface-container">
                Importar…
                <input type="file" accept=".json,application/json" class="hidden" @change="importBackup($event)"/>
            </label>
            <button type="button" @click="undoImport()" class="px-4 py-2 rounded-xl border border-error text-error text-xs font-bold uppercase">Deshacer import</button>
        </div>
        <p class="text-xs text-on-surface-variant" x-text="msg"></p>
    </section>
</div>
@endsection
