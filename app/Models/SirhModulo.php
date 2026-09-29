<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class SirhModulo extends Model
{
    protected $table = 'sirh_modulos';

    protected $fillable = [
        'modulo', 'fase', 'estado', 'prioridad', 'avance', 'riesgo',
        'responsable', 'proveedor', 'fecha_inicio', 'fecha_fin_prevista', 'fecha_fin_real',
        'bloqueo', 'hito', 'area', 'activo', 'descripcion', 'orden', 'icono', 'equipo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'avance' => 'integer',
        'orden' => 'integer',
        'fecha_inicio' => 'date',
        'fecha_fin_prevista' => 'date',
        'fecha_fin_real' => 'date',
    ];

    public const ESTADOS = [
        'Planificado', 'Alcance', 'En desarrollo', 'En pruebas', 'Operativo', 'Pausado', 'Cancelado',
    ];

    public const PRIORIDADES = ['Alta', 'Media', 'Baja'];
    public const RIESGOS = ['Alto', 'Medio', 'Bajo'];
    public const AREAS = ['gestion', 'tableros', 'autogestion'];

    public const AREA_LABELS = [
        'gestion' => 'Gestión',
        'tableros' => 'Tableros',
        'autogestion' => 'Autogestión',
    ];

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    public function equipoList(): array
    {
        $parts = preg_split('/[\n,;]+/', (string) $this->equipo) ?: [];

        return array_values(array_filter(array_map('trim', $parts)));
    }

    public function areaLabel(): string
    {
        return self::AREA_LABELS[$this->area] ?? $this->area;
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'modulo' => $this->modulo,
            'fase' => $this->fase ?? '',
            'estado' => $this->estado,
            'prioridad' => $this->prioridad,
            'avance' => (int) $this->avance,
            'riesgo' => $this->riesgo,
            'responsable' => $this->responsable ?? '',
            'proveedor' => $this->proveedor ?? '',
            'fecha_inicio' => optional($this->fecha_inicio)->format('Y-m-d'),
            'fecha_fin_prevista' => optional($this->fecha_fin_prevista)->format('Y-m-d'),
            'fecha_fin_real' => optional($this->fecha_fin_real)->format('Y-m-d'),
            'bloqueo' => $this->bloqueo ?? '',
            'hito' => $this->hito ?? '',
            'area' => $this->area,
            'activo' => $this->activo ? 1 : 0,
            'descripcion' => $this->descripcion ?? '',
            'orden' => (int) $this->orden,
            'icono' => $this->icono ?: 'view_module',
            'equipo' => $this->equipo ?? '',
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
