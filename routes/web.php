<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\HoyController;
use App\Http\Controllers\InformeController;
use App\Http\Controllers\ModulosController;
use App\Http\Controllers\SirhApiController;
use App\Http\Controllers\TableroController;
use Illuminate\Support\Facades\Route;

Route::get('/', HoyController::class)->name('hoy');
Route::get('/modulos', [ModulosController::class, 'index'])->name('modulos');
Route::get('/tablero', TableroController::class)->name('tablero');
Route::get('/informe', InformeController::class)->name('informe');
Route::get('/admin', [AdminController::class, 'index'])->name('admin');
Route::post('/admin/brand', [AdminController::class, 'saveBrand'])->name('admin.brand');

Route::redirect('/gestion', '/modulos?area=gestion');
Route::redirect('/tableros', '/modulos?area=tableros');
Route::redirect('/autogestion', '/modulos?area=autogestion');

Route::prefix('api')->group(function () {
    Route::get('/health', [SirhApiController::class, 'health']);
    Route::get('/sirh/modulos', [SirhApiController::class, 'index']);
    Route::post('/sirh/modulos', [SirhApiController::class, 'upsert']);
    Route::delete('/sirh/modulos/{id}', [SirhApiController::class, 'destroy'])->whereNumber('id');
    Route::get('/sirh/catalogos', [SirhApiController::class, 'catalogos']);
    Route::get('/sirh/stats', [SirhApiController::class, 'stats']);
    Route::get('/sirh/export', [SirhApiController::class, 'export']);
    Route::post('/sirh/import', [SirhApiController::class, 'import']);
    Route::post('/sirh/undo-import', [SirhApiController::class, 'undoImport']);
    Route::get('/sirh/backup', [SirhApiController::class, 'backupExport']);
    Route::post('/sirh/backup', [SirhApiController::class, 'backupImport']);
});
