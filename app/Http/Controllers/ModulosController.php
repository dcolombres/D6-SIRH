<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ModulosController extends Controller
{
    public function index(Request $request, SirhStatsService $sirh): View
    {
        $area = $request->query('area');
        $rows = SirhModulo::query()->orderBy('orden')->orderBy('modulo')->get();

        return view('modulos', [
            'rowsJson' => $rows->map->toApiArray()->values(),
            'catalogs' => $sirh->catalogs(),
            'initialArea' => in_array($area, SirhModulo::AREAS, true) ? $area : '',
            'brand' => Setting::brand(),
            'nav' => 'modulos',
        ]);
    }
}
