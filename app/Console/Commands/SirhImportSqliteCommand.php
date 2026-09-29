<?php

namespace App\Console\Commands;

use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SirhImportSqliteCommand extends Command
{
    protected $signature = 'sirh:import-sqlite {path=data/sirh.sqlite : Path to legacy sql.js sqlite file} {--fresh : Truncate modulos before import}';

    protected $description = 'Import SIRH modules from legacy SQLite (sql.js) file into MySQL/SQLite Laravel DB';

    public function handle(SirhStatsService $sirh): int
    {
        $path = $this->argument('path');
        if (! is_file($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        if (! extension_loaded('pdo_sqlite') && ! class_exists(\SQLite3::class)) {
            $this->warn('pdo_sqlite not available; attempting SQLite3 extension…');
        }

        try {
            $pdo = new \PDO('sqlite:'.$path);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->query('SELECT * FROM sirh_modulos');
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            $this->error('Could not read SQLite: '.$e->getMessage());

            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            SirhModulo::query()->delete();
        }

        $n = 0;
        DB::transaction(function () use ($rows, $sirh, &$n) {
            foreach ($rows as $raw) {
                $data = $sirh->normalizePayload($raw);
                if ($data['modulo'] === '') {
                    continue;
                }
                unset($raw['id']);
                SirhModulo::query()->updateOrCreate(
                    ['modulo' => $data['modulo']],
                    $data
                );
                $n++;
            }
        });

        $this->info("Imported/updated {$n} modules from {$path}");

        return self::SUCCESS;
    }
}
