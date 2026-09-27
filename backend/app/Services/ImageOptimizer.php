<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageOptimizer
{
    /**
     * Store and optimize an uploaded image.
     *
     * @param UploadedFile $file
     * @param string $folder Directory inside public disk (e.g. 'banners', 'categories')
     * @param int $maxDimension Max width or height in pixels
     * @param int $quality JPEG compression quality (1-100)
     * @return string Path relative to storage disk
     */
    public static function storeOptimized(UploadedFile $file, string $folder, int $maxDimension = 1400, int $quality = 78): string
    {
        $path = $file->store($folder, 'public');
        $fullPath = Storage::disk('public')->path($path);

        self::optimizeFile($fullPath, $maxDimension, $quality);

        return $path;
    }

    /**
     * In-place optimization for an existing image file on disk.
     */
    public static function optimizeFile(string $filePath, int $maxDimension = 1400, int $quality = 78): void
    {
        if (!file_exists($filePath)) return;
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) return;

        // Skip small files (already under 60KB)
        if (filesize($filePath) < 60000) return;

        $image = null;
        if ($ext === 'png') {
            $image = @imagecreatefrompng($filePath);
        } elseif ($ext === 'webp' && function_exists('imagecreatefromwebp')) {
            $image = @imagecreatefromwebp($filePath);
        } else {
            $image = @imagecreatefromjpeg($filePath);
        }

        if (!$image) return;

        $width = imagesx($image);
        $height = imagesy($image);

        $newWidth = $width;
        $newHeight = $height;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $newWidth = (int)($width * $ratio);
            $newHeight = (int)($height * $ratio);
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);

        if ($ext === 'png') {
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagepng($resized, $filePath, 7);
        } else {
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imageinterlace($resized, true);
            imagejpeg($resized, $filePath, $quality);
        }

        imagedestroy($image);
        imagedestroy($resized);
    }
}
