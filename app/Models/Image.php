<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'album_id',
        'path',
        'image_data',
        'image_mime',
        'caption',
    ];

    protected $appends = ['url'];

    /**
     * Get the full URL for the image.
     */
    public function getUrlAttribute()
    {
        // If we have image_data (base64), return a data URL
        if ($this->image_data && $this->image_mime) {
            return "data:{$this->image_mime};base64,{$this->image_data}";
        }
        
        // Fallback to file path if available
        if ($this->path) {
            return asset(Storage::url($this->path));
        }
        
        return null;
    }

    /**
     * Get the album that owns the image.
     */
    public function album()
    {
        return $this->belongsTo(Album::class);
    }
} 