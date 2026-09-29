<!DOCTYPE html>
<html lang="es" class="light">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content="{{ csrf_token() }}"/>
    <title>{{ $brand['appTitle'] ?? 'D6' }} · @yield('title', 'SIRH')</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Hanken+Grotesk:wght@600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style id="dynamic-brand">:root { --primary-color: {{ $brand['primaryColor'] ?? '#111111' }}; }</style>
    <style>{!! $brand['customCSS'] ?? '' !!}</style>
    @stack('head')
</head>
<body class="text-on-surface font-body bg-surface" x-data>
<aside class="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col p-container-padding z-50 no-print"
       :class="{ 'w-20': $store.shell?.collapsed }">
    <div class="mb-section-gap flex items-center justify-between">
        <div class="flex flex-col">
            <h1 class="text-2xl font-bold tracking-tight text-primary">{{ $brand['appTitle'] ?? 'D6' }}</h1>
            <p class="text-on-surface-variant text-sm opacity-70 sidebar-label">{{ $brand['appSubtitle'] ?? 'SIRH' }}</p>
        </div>
    </div>
    <nav class="flex-1 px-2 space-y-1 overflow-y-auto">
        <p class="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 sidebar-label">Follow-up SIRH</p>
        @php $nav = $nav ?? ''; @endphp
        <a href="{{ route('hoy') }}" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded text-secondary hover:bg-surface-container-high transition-all {{ $nav==='hoy' ? 'active bg-primary text-white' : '' }}">
            <span class="material-symbols-outlined">today</span>
            <span class="sidebar-label text-sm font-semibold">Hoy</span>
        </a>
        <a href="{{ route('modulos') }}" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded text-secondary hover:bg-surface-container-high transition-all {{ $nav==='modulos' ? 'active bg-primary text-white' : '' }}">
            <span class="material-symbols-outlined">view_module</span>
            <span class="sidebar-label text-sm font-semibold">Módulos SIRH</span>
        </a>
        <a href="{{ route('tablero') }}" class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded text-secondary hover:bg-surface-container-high transition-all {{ $nav==='tablero' ? 'active bg-primary text-white' : '' }}">
            <span class="material-symbols-outlined">analytics</span>
            <span class="sidebar-label text-sm font-semibold">Tablero</span>
        </a>
    </nav>
</aside>

<header class="fixed top-0 right-0 left-[280px] h-touch-target bg-surface-bright flex justify-between items-center px-container-padding z-40 border-b border-outline-variant no-print">
    <h2 class="text-sm font-bold uppercase tracking-widest text-on-surface-variant truncate">@yield('header', 'D6 · SIRH')</h2>
    <div class="flex items-center gap-1">
        @yield('header-actions')
        <a href="{{ route('informe') }}" class="p-2 rounded-lg {{ $nav==='informe' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-surface-container-high' }}" title="Informe" aria-label="Informe">
            <span class="material-symbols-outlined">present_to_all</span>
        </a>
        <a href="{{ route('admin') }}" class="p-2 rounded-lg {{ $nav==='admin' ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-surface-container-high' }}" title="Administración" aria-label="Administración">
            <span class="material-symbols-outlined">settings</span>
        </a>
    </div>
</header>

<main class="ml-[280px] pt-touch-target min-h-screen p-6">
    @if(session('ok'))
        <div class="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 text-sm">{{ session('ok') }}</div>
    @endif
    @yield('content')
</main>
@stack('scripts')
</body>
</html>
