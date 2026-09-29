<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\View\View;

class InformeController extends Controller
{
    public function __invoke(SirhStatsService $sirh): View
    {
        $rows = SirhModulo::query()->activos()->orderBy('orden')->get();

        return view('informe', [
            'rows' => $rows,
            'stats' => $sirh->stats($rows),
            'brand' => Setting::brand(),
            'nav' => 'informe',
        ]);
    }
}
