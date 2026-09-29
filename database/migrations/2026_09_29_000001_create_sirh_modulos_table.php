<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sirh_modulos', function (Blueprint $table) {
            $table->id();
            $table->string('modulo');
            $table->string('fase')->default('');
            $table->string('estado')->default('Planificado');
            $table->string('prioridad')->default('Media');
            $table->unsignedTinyInteger('avance')->default(0);
            $table->string('riesgo')->default('Medio');
            $table->string('responsable')->default('');
            $table->string('proveedor')->default('');
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin_prevista')->nullable();
            $table->date('fecha_fin_real')->nullable();
            $table->text('bloqueo')->nullable();
            $table->string('hito')->default('');
            $table->string('area', 32)->default('gestion');
            $table->boolean('activo')->default(true);
            $table->text('descripcion')->nullable();
            $table->unsignedInteger('orden')->default(0);
            $table->string('icono')->default('view_module');
            $table->text('equipo')->nullable();
            $table->timestamps();

            $table->index(['area', 'activo']);
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sirh_modulos');
    }
};
