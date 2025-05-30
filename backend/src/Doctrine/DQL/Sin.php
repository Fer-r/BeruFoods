<?php

namespace App\Doctrine\DQL;

use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

class Sin extends FunctionNode
{
    public $simpleArithmeticExpression;

    public function getSql(SqlWalker $sqlWalker): string
    {
        return 'SIN(' . $this->simpleArithmeticExpression->dispatch($sqlWalker) . ')';
    }

    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER);
        $parser->match(TokenType::T_OPEN_PARENTHESIS);
        $this->simpleArithmeticExpression = $parser->SimpleArithmeticExpression();
        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }
} 