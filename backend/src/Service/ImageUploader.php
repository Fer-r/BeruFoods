<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

class ImageUploader
{
    private SluggerInterface $slugger;
    private string $targetDirectory;
    private Filesystem $filesystem;

    public function __construct(SluggerInterface $slugger, string $targetDirectory, Filesystem $filesystem)
    {
        $this->slugger = $slugger;
        $this->targetDirectory = $targetDirectory;
        $this->filesystem = $filesystem;
    }

    /**
     * Uploads an image file, typically for a restaurant.
     *
     * @param UploadedFile|null $file The uploaded file object.
     * @return string|null The generated filename if upload is successful, null otherwise or if $file is null.
     * @throws FileException If the file cannot be moved.
     */
    public function upload(?UploadedFile $file): ?string
    {
        if (!$file) {
            return null;
        }

        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $fileName = $safeFilename.'-'.uniqid('', true).'.'.$file->guessExtension();

        try {
            // Ensure the target directory exists
             $this->filesystem->mkdir($this->targetDirectory);
            // Move the file to the target directory
            $file->move($this->getTargetDirectory(), $fileName);
        } catch (FileException $e) {
            // Re-throw the exception to be handled by the caller
            throw new FileException("Could not move the uploaded file: " . $e->getMessage());
        }

        return $fileName;
    }

    public function getTargetDirectory(): string
    {
        return $this->targetDirectory;
    }
} 