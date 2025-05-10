<?php

namespace App\Service;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\String\Slugger\SluggerInterface;

class ImageUploader
{
    private string $imagesDirectory;
    private string $imagesPublicPath;
    private SluggerInterface $slugger;
    private Filesystem $filesystem;

    public function __construct(
        SluggerInterface $slugger,
        Filesystem $filesystem,
        string $imagesDirectory,
        string $imagesPublicPath
    ) {
        $this->slugger = $slugger;
        $this->filesystem = $filesystem;
        $this->imagesDirectory = $imagesDirectory;
        $this->imagesPublicPath = $imagesPublicPath;
    }

    /**
     * Uploads an image file, typically for a restaurant.
     *
     * @param UploadedFile|null $file The uploaded file object.
     * @return string|null The generated filename if upload is successful, null otherwise or if $file is null.
     * @throws FileException If the file cannot be moved.
     */
    public function uploadImage(UploadedFile $file): string
    {
        $this->validateImage($file);

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $newFilename = $safeFilename.'-'.uniqid().'.'.$file->guessExtension();

        try {
            $file->move($this->imagesDirectory, $newFilename);
        } catch (FileException $e) {
            throw new FileException('Failed to upload image: '.$e->getMessage());
        }

        return $newFilename;
    }

    public function deleteImage(?string $filename): void
    {
        if ($filename) {
            $this->filesystem->remove($this->imagesDirectory.'/'.$filename);
        }
    }

    public function getImageUrl(?string $filename): ?string
    {
        if (!$filename) {
            return null;
        }
        return rtrim($this->imagesPublicPath, '/') . '/' . $filename;
    }

    /**
     * @throws FileException
     */
    private function validateImage(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
            throw new FileException('Invalid file type. Only JPG, PNG, GIF allowed.');
        }
        if ($file->getSize() > 4 * 1024 * 1024) {
            throw new FileException('File is too large. Max 4MB allowed.');
        }
    }
}