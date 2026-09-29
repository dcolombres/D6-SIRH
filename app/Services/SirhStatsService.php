<?php

namespace App\Services;

use App\Models\SirhModulo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class SirhStatsService
{
    public function catalogs(): array
    {
        return [
            'estados' => SirhModulo::ESTADOS,
            'prioridades' => SirhModulo::PRIORIDADES,
            'riesgos' => SirhModulo::RIESGOS,
            'areas' => collect(SirhModulo::AREAS)->map(fn ($id) => [
                'id' => $id,
                'label' => SirhModulo::AREA_LABELS[$id] ?? $id,
            ])->values()->all(),
        ];
    }

    public function stats(?Collection $rows = null): array
    {
        $rows = $rows ?? SirhModulo::query()->activos()->get();
        $today = Carbon::today();

        $byEstado = [];
        $byRiesgo = [];
        $byArea = [];
        $avanceSum = 0;
        $riesgoAlto = 0;
        $vencidos = 0;

        foreach ($rows as $r) {
            $byEstado[$r->estado] = ($byEstado[$r->estado] ?? 0) + 1;
            $byRiesgo[$r->riesgo] = ($byRiesgo[$r->riesgo] ?? 0) + 1;
            $byArea[$r->area] = ($byArea[$r->area] ?? 0) + 1;
            $avanceSum += (int) $r->avance;
            if (strcasecmp((string) $r->riesgo, 'Alto') === 0) {
                $riesgoAlto++;
            }
            $fin = $r->fecha_fin_prevista;
            $estado = (string) $r->estado;
            if ($fin && $fin->lt($today)
                && stripos($estado, 'Operativo') === false
                && stripos($estado, 'Cancel') === false) {
                $vencidos++;
            }
        }

        $n = $rows->count();

        return [
            'total' => $n,
            'avanceMedio' => $n ? (int) round($avanceSum / $n) : 0,
            'riesgoAlto' => $riesgoAlto,
            'vencidos' => $vencidos,
            'byEstado' => $byEstado,
            'byRiesgo' => $byRiesgo,
            'byArea' => $byArea,
        ];
    }

    public function focusItems(Collection $rows, int $limit = 8): Collection
    {
        $today = Carbon::today();

        return $rows
            ->filter(function (SirhModulo $r) use ($today) {
                if (strcasecmp((string) $r->riesgo, 'Alto') === 0) {
                    return true;
                }
                $fin = $r->fecha_fin_prevista;
                $estado = (string) $r->estado;

                return $fin && $fin->lt($today)
                    && stripos($estado, 'Operativo') === false
                    && stripos($estado, 'Cancel') === false;
            })
            ->sortByDesc(fn (SirhModulo $r) => [strcasecmp((string) $r->riesgo, 'Alto') === 0 ? 1 : 0, (int) $r->avance])
            ->take($limit)
            ->values();
    }

    public function normalizePayload(array $payload): array
    {
        $equipo = $payload['equipo'] ?? '';
        if (is_array($equipo)) {
            $equipo = implode("\n", array_filter(array_map('trim', $equipo)));
        } else {
            $parts = preg_split('/[\n,;]+/', (string) $equipo) ?: [];
            $equipo = implode("\n", array_values(array_filter(array_map('trim', $parts))));
        }

        $estado = $payload['estado'] ?? 'Planificado';
        if (! in_array($estado, SirhModulo::ESTADOS, true)) {
            $estado = 'Planificado';
        }
        $prioridad = $payload['prioridad'] ?? 'Media';
        if (! in_array($prioridad, SirhModulo::PRIORIDADES, true)) {
            $prioridad = 'Media';
        }
        $riesgo = $payload['riesgo'] ?? 'Medio';
        if (! in_array($riesgo, SirhModulo::RIESGOS, true)) {
            $riesgo = 'Medio';
        }
        $area = $payload['area'] ?? 'gestion';
        if (! in_array($area, SirhModulo::AREAS, true)) {
            $area = 'gestion';
        }

        $avance = max(0, min(100, (int) ($payload['avance'] ?? 0)));
        $fechaFinReal = $payload['fecha_fin_real'] ?? null;
        if ($estado === 'Operativo' && empty($fechaFinReal)) {
            $fechaFinReal = Carbon::today()->format('Y-m-d');
        }

        return [
            'modulo' => trim((string) ($payload['modulo'] ?? '')),
            'fase' => trim((string) ($payload['fase'] ?? '')),
            'estado' => $estado,
            'prioridad' => $prioridad,
            'avance' => $avance,
            'riesgo' => $riesgo,
            'responsable' => trim((string) ($payload['responsable'] ?? '')),
            'proveedor' => trim((string) ($payload['proveedor'] ?? '')),
            'fecha_inicio' => ($payload['fecha_inicio'] ?? null) ?: null,
            'fecha_fin_prevista' => ($payload['fecha_fin_prevista'] ?? null) ?: null,
            'fecha_fin_real' => $fechaFinReal ?: null,
            'bloqueo' => trim((string) ($payload['bloqueo'] ?? '')),
            'hito' => trim((string) ($payload['hito'] ?? '')),
            'area' => $area,
            'activo' => filter_var($payload['activo'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'descripcion' => trim((string) ($payload['descripcion'] ?? '')),
            'orden' => (int) ($payload['orden'] ?? 0),
            'icono' => trim((string) ($payload['icono'] ?? 'view_module')) ?: 'view_module',
            'equipo' => $equipo,
        ];
    }
}
