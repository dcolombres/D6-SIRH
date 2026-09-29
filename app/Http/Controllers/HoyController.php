<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\View\View;

class HoyController extends Controller
{
    public function __invoke(SirhStatsService $sirh): View
    {
        $rows = SirhModulo::query()->activos()->orderBy('orden')->get();

        return view('hoy', [
            'stats' => $sirh->stats($rows),
            'focus' => $sirh->focusItems($rows),
            'rows' => $rows,
            'brand' => Setting::brand(),
            'nav' => 'hoy',
        ]);
    }
}
