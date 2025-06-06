<?php

namespace App\Service;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class ImageManager
{
    private string $imagesDirectory;
    private string $imagesPublicPath;
    private SluggerInterface $slugger;
    private Filesystem $filesystem;
    private ParameterBagInterface $parameterBag;

    public function __construct(
        SluggerInterface $slugger,
        Filesystem $filesystem,
        string $imagesDirectory,
        string $imagesPublicPath,
        ParameterBagInterface $parameterBag
    ) {
        $this->slugger = $slugger;
        $this->filesystem = $filesystem;
        $this->imagesDirectory = $imagesDirectory;
        $this->imagesPublicPath = $imagesPublicPath;
        $this->parameterBag = $parameterBag;
    }

    /**
     * Uploads an image file and creates an optimized webp version.
     *
     * @param UploadedFile $file The uploaded file object.
     * @return string The generated filename if upload is successful.
     * @throws FileException If the file cannot be moved or processed.
     */
    public function uploadImage(UploadedFile $file): string
    {
        $this->validateImage($file);

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $newFilename = $safeFilename.'-'.uniqid().'.'.$file->guessExtension();

        try {
            $file->move($this->imagesDirectory, $newFilename);
            
            try {
                $this->createOptimizedWebp($newFilename);
            } catch (\Exception $e) {
                error_log('WebP optimization failed for ' . $newFilename . ': ' . $e->getMessage());
            }
            
        } catch (FileException $e) {
            throw new FileException('Failed to upload image: '.$e->getMessage());
        }

        return $newFilename;
    }

    public function deleteImage(?string $filename): void
    {
        if ($filename) {
            $this->filesystem->remove($this->imagesDirectory.'/'.$filename);
            
            $webpFilename = $this->getWebpFilename($filename);
            $this->filesystem->remove($this->imagesDirectory.'/'.$webpFilename);
        }
    }

    public function getImageUrl(?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }
        
        $webpFilename = $this->getWebpFilename($filename);
        $webpPath = $this->imagesDirectory . '/' . $webpFilename;
        
        $finalFilename = (file_exists($webpPath)) ? $webpFilename : $filename;
        $relativePath = rtrim($this->imagesPublicPath, '/') . '/' . $finalFilename;
        
        // In production, return complete URL with domain (if base URL is configured)
        if ($this->parameterBag->get('kernel.environment') === 'prod') {
            $baseUrl = $this->parameterBag->get('app.base_url');
            if (!empty($baseUrl)) {
                return rtrim($baseUrl, '/') . $relativePath;
            }
        }
        
        // In dev/test, return relative path (nginx handles it)
        return $relativePath;
    }

    /**
     * Creates an optimized webp version of the uploaded image.
     *
     * @param string $filename The original filename
     * @throws FileException If the webp conversion fails
     */
    private function createOptimizedWebp(string $filename): void
    {
        if (!extension_loaded('gd')) {
            // If GD is not available, skip webp creation
            return;
        }

        if (!function_exists('imagewebp')) {
            // If WebP support is not available in GD, skip webp creation
            return;
        }

        $originalPath = $this->imagesDirectory . '/' . $filename;
        $webpFilename = $this->getWebpFilename($filename);
        $webpPath = $this->imagesDirectory . '/' . $webpFilename;

        try {
            // Get the original image mime type
            $imageInfo = getimagesize($originalPath);
            if ($imageInfo === false) {
                throw new FileException('Could not get image information');
            }

            $mimeType = $imageInfo['mime'];
            
            // Create image resource from original file
            $image = match ($mimeType) {
                'image/jpeg' => imagecreatefromjpeg($originalPath),
                'image/png' => imagecreatefrompng($originalPath),
                'image/webp' => imagecreatefromwebp($originalPath),
                default => throw new FileException('Unsupported image type for webp conversion: ' . $mimeType)
            };

            if ($image === false) {
                throw new FileException('Could not create image resource from uploaded file');
            }

            // Preserve transparency for PNG images
            if ($mimeType === 'image/png') {
                imagepalettetotruecolor($image);
                imagealphablending($image, true);
                imagesavealpha($image, true);
            }

            // Convert to webp with quality 85 (good balance between quality and file size)
            $success = imagewebp($image, $webpPath, 85);
            
            // Free up memory
            imagedestroy($image);

            if (!$success) {
                throw new FileException('Failed to convert image to webp format');
            }

        } catch (\Exception $e) {
            throw new FileException('Failed to create optimized webp version: ' . $e->getMessage());
        }
    }

    /**
     * Generates the webp filename from the original filename.
     *
     * @param string $originalFilename
     * @return string
     */
    private function getWebpFilename(string $originalFilename): string
    {
        $pathInfo = pathinfo($originalFilename);
        return $pathInfo['filename'] . '.webp';
    }

    /**
     * @throws FileException
     */
    private function validateImage(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'])) {
            throw new FileException('Invalid file type. Only JPG, PNG, WEBP allowed.');
        }
        if ($file->getSize() > 4 * 1024 * 1024) {
            throw new FileException('File is too large. Max 4MB allowed.');
        }
    }
}