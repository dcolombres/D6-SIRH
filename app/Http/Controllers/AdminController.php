<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function index(): View
    {
        return view('admin', [
            'brand' => Setting::brand(),
            'nav' => 'admin',
            'count' => SirhModulo::query()->count(),
        ]);
    }

    public function saveBrand(Request $request): RedirectResponse
    {
        $brand = Setting::brand();
        $brand['appTitle'] = trim((string) $request->input('appTitle', $brand['appTitle']));
        $brand['appSubtitle'] = trim((string) $request->input('appSubtitle', $brand['appSubtitle']));
        $brand['primaryColor'] = trim((string) $request->input('primaryColor', $brand['primaryColor'])) ?: '#111111';
        $brand['customCSS'] = (string) $request->input('customCSS', $brand['customCSS'] ?? '');
        $brand['operatorName'] = trim((string) $request->input('operatorName', $brand['operatorName'] ?? ''));
        Setting::putValue('brand', $brand);

        return redirect()->route('admin')->with('ok', 'Marca guardada.');
    }
}
