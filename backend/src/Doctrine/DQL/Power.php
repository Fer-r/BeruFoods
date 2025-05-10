<?php

namespace App\Doctrine\DQL;

use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

/**
 * "POWER" "(" SimpleArithmeticExpression "," SimpleArithmeticExpression ")"
 */
class Power extends FunctionNode
{
    public $baseExpression;
    public $exponentExpression;

    public function getSql(SqlWalker $sqlWalker): string
    {
        return 'POWER(' .
            $this->baseExpression->dispatch($sqlWalker) . ',' .
            $this->exponentExpression->dispatch($sqlWalker) .
        ')';
    }

    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER); // Function name
        $parser->match(TokenType::T_OPEN_PARENTHESIS);
        $this->baseExpression = $parser->SimpleArithmeticExpression();
        $parser->match(TokenType::T_COMMA);
        $this->exponentExpression = $parser->SimpleArithmeticExpression();
        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }
} 