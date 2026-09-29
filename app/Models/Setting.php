<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $row = static::query()->find($key);

        return $row?->value ?? $default;
    }

    public static function putValue(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('d6.settings.brand');
    }

    public static function brand(): array
    {
        return Cache::remember('d6.settings.brand', 60, function () {
            return array_merge([
                'appTitle' => 'D6',
                'appSubtitle' => 'Gestión, seguimiento y reportería SIRH',
                'primaryColor' => '#111111',
                'customCSS' => '',
                'logoUrl' => null,
                'operatorName' => '',
            ], static::getValue('brand', []) ?? []);
        });
    }
}
