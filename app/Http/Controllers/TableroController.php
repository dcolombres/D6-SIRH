<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\View\View;

class TableroController extends Controller
{
    public function __invoke(SirhStatsService $sirh): View
    {
        $rows = SirhModulo::query()->activos()->orderBy('orden')->get();

        return view('tablero', [
            'rowsJson' => $rows->map->toApiArray()->values(),
            'catalogs' => $sirh->catalogs(),
            'brand' => Setting::brand(),
            'nav' => 'tablero',
        ]);
    }
}
