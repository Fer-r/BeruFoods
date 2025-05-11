<?php

namespace App\Controller\Trait;

use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Component\HttpFoundation\Request;

trait PaginationTrait
{
    private const DEFAULT_ITEMS_PER_PAGE = 10;

    protected function paginate(
        \Doctrine\ORM\QueryBuilder $qb,
        Request $request,
        int $defaultLimit = self::DEFAULT_ITEMS_PER_PAGE
    ): array {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', $defaultLimit);
        $limit = max(1, min(100, $limit)); // Ensure limit is within a reasonable range

        $paginator = new Paginator($qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery(), true);
        $totalItems = count($paginator);
        $pagesCount = ceil($totalItems / $limit);
        $results = iterator_to_array($paginator->getIterator());

        return [
            'items' => $results,
            'pagination' => [
                'totalItems' => $totalItems,
                'currentPage' => $page,
                'itemsPerPage' => $limit,
                'totalPages' => $pagesCount,
            ],
        ];
    }
} 