<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/uploads')]
final class UploadsController extends AbstractController
{
    public function __construct(
        private string $projectDir
    ) {}

    #[Route('/images/restaurants/{filename}', name: 'uploads_restaurant_image', methods: ['GET'], requirements: ['filename' => '[^/]+'], condition: "env('APP_ENV') == 'prod'")]
    public function serveRestaurantImage(string $filename): BinaryFileResponse
    {
        // Security: prevent directory traversal
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            throw new NotFoundHttpException('Invalid filename');
        }
        
        $filePath = $this->projectDir . '/public/uploads/images/restaurants/' . $filename;
        
        if (!file_exists($filePath) || !is_file($filePath)) {
            throw new NotFoundHttpException('Image not found');
        }

        $response = new BinaryFileResponse($filePath);
        
        // Add caching headers
        $response->setMaxAge(86400); // 24 hours
        $response->setPublic();
        
        return $response;
    }

    #[Route('/images/article_images/{filename}', name: 'uploads_article_image', methods: ['GET'], requirements: ['filename' => '[^/]+'], condition: "env('APP_ENV') == 'prod'")]
    public function serveArticleImage(string $filename): BinaryFileResponse
    {
        // Security: prevent directory traversal
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            throw new NotFoundHttpException('Invalid filename');
        }
        
        $filePath = $this->projectDir . '/public/uploads/images/article_images/' . $filename;
        
        if (!file_exists($filePath) || !is_file($filePath)) {
            throw new NotFoundHttpException('Image not found');
        }

        $response = new BinaryFileResponse($filePath);
        
        // Add caching headers
        $response->setMaxAge(86400); // 24 hours
        $response->setPublic();
        
        return $response;
    }
} 