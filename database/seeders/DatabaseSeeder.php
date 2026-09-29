<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Setting::putValue('brand', [
            'appTitle' => 'D6',
            'appSubtitle' => 'Gestión, seguimiento y reportería SIRH',
            'primaryColor' => '#111111',
            'customCSS' => '',
            'logoUrl' => null,
            'operatorName' => '',
        ]);

        if (SirhModulo::query()->exists()) {
            return;
        }

        $path = database_path('seeders/sirh_seed.json');
        $rows = json_decode(file_get_contents($path), true) ?: [];
        $sirh = app(SirhStatsService::class);
        foreach ($rows as $raw) {
            $data = $sirh->normalizePayload($raw);
            if ($data['modulo'] === '') {
                continue;
            }
            SirhModulo::query()->create($data);
        }
    }
}
