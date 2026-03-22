<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('custom_avatars', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->primary();
            $table->longText('content');
            $table->string('mime', 64);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_avatars');
    }
};
