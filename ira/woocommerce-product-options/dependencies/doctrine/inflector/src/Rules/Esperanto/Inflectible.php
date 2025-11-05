<?php

declare (strict_types=1);
namespace Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector\Rules\Esperanto;

use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector\Rules\Pattern;
use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector\Rules\Substitution;
use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector\Rules\Transformation;
use Barn2\Plugin\WC_Product_Options\Dependencies\Doctrine\Inflector\Rules\Word;
class Inflectible
{
    /** @return Transformation[] */
    public static function getSingular(): iterable
    {
        yield new Transformation(new Pattern('oj$'), 'o');
    }
    /** @return Transformation[] */
    public static function getPlural(): iterable
    {
        yield new Transformation(new Pattern('o$'), 'oj');
    }
    /** @return Substitution[] */
    public static function getIrregular(): iterable
    {
        yield new Substitution(new Word(''), new Word(''));
    }
}
