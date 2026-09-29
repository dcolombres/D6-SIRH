<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SirhModulo;
use App\Services\SirhStatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SirhApiController extends Controller
{
    public function __construct(private SirhStatsService $sirh) {}

    public function health(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'app' => 'D6-SIRH',
            'db' => config('database.default'),
        ]);
    }

    public function index(): JsonResponse
    {
        $rows = SirhModulo::query()->orderBy('orden')->orderBy('modulo')->get()
            ->map(fn (SirhModulo $m) => $m->toApiArray());

        return response()->json(['rows' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $this->sirh->normalizePayload($request->all());
        if ($data['modulo'] === '') {
            return response()->json(['ok' => false, 'error' => 'El nombre del módulo es obligatorio'], 422);
        }

        $id = $request->input('id');
        if ($id) {
            $row = SirhModulo::query()->find($id);
            if (! $row) {
                return response()->json(['ok' => false, 'error' => 'Módulo no encontrado'], 404);
            }
            $row->fill($data)->save();
        } else {
            $row = SirhModulo::query()->create($data);
        }

        return response()->json(['ok' => true, 'row' => $row->toApiArray()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $row = SirhModulo::query()->find($id);
        if (! $row) {
            return response()->json(['error' => 'No encontrado'], 404);
        }
        $row->delete();

        return response()->json(['ok' => true]);
    }

    public function catalogos(): JsonResponse
    {
        return response()->json($this->sirh->catalogs());
    }

    public function stats(): JsonResponse
    {
        return response()->json($this->sirh->stats());
    }

    public function export(): JsonResponse
    {
        $rows = SirhModulo::query()->orderBy('orden')->get()->map->toApiArray();

        return response()->json([
            'sirh_modulos' => $rows,
            'exportedAt' => now()->toIso8601String(),
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $rows = $request->input('sirh_modulos', $request->input('rows', []));
        if (! is_array($rows)) {
            return response()->json(['ok' => false, 'error' => 'Payload inválido'], 422);
        }

        // one-level undo snapshot
        $prev = SirhModulo::query()->get()->map->toApiArray()->all();
        Storage::disk('local')->put('sirh_prev.json', json_encode(['sirh_modulos' => $prev, 'at' => now()->toIso8601String()]));

        DB::transaction(function () use ($rows) {
            SirhModulo::query()->delete();
            foreach ($rows as $raw) {
                $data = $this->sirh->normalizePayload(is_array($raw) ? $raw : []);
                if ($data['modulo'] === '') {
                    continue;
                }
                SirhModulo::query()->create($data);
            }
        });

        return response()->json(['ok' => true, 'count' => SirhModulo::query()->count()]);
    }

    public function undoImport(): JsonResponse
    {
        if (! Storage::disk('local')->exists('sirh_prev.json')) {
            return response()->json(['ok' => false, 'error' => 'No hay import previo para deshacer'], 404);
        }
        $payload = json_decode(Storage::disk('local')->get('sirh_prev.json'), true);
        $rows = $payload['sirh_modulos'] ?? [];
        DB::transaction(function () use ($rows) {
            SirhModulo::query()->delete();
            foreach ($rows as $raw) {
                $data = $this->sirh->normalizePayload($raw);
                if ($data['modulo'] === '') {
                    continue;
                }
                SirhModulo::query()->create($data);
            }
        });
        Storage::disk('local')->delete('sirh_prev.json');

        return response()->json(['ok' => true, 'count' => SirhModulo::query()->count()]);
    }

    public function backupExport(): JsonResponse
    {
        return response()->json([
            'settings' => ['brand' => Setting::brand()],
            'sirh_modulos' => SirhModulo::query()->orderBy('orden')->get()->map->toApiArray(),
            '_meta' => [
                'exportedAt' => now()->toIso8601String(),
                'app' => 'D6-SIRH',
                'version' => '2.0.0-laravel',
            ],
        ]);
    }

    public function backupImport(Request $request): JsonResponse
    {
        if ($request->has('settings.brand') || $request->input('settings.brand')) {
            Setting::putValue('brand', $request->input('settings.brand'));
        }
        $imp = $this->import($request);
        if ($imp->getStatusCode() >= 400) {
            return $imp;
        }

        return response()->json(['ok' => true, 'count' => SirhModulo::query()->count()]);
    }
}
