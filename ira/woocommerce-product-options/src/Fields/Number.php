<?php
namespace Barn2\Plugin\WC_Product_Options\Fields;

use Barn2\Plugin\WC_Product_Options\Util\Util;
use Barn2\Plugin\WC_Product_Options\Util\Conditional_Logic as Conditional_Logic_Util;
use WP_Error;

/**
 * Number input field class.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Plugins <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 */
class Number extends Abstract_Field {

	protected $type           = 'number';
	protected $has_user_value = true;

	/**
	 * Supports multiple values (e.g checkboxes, radios).
	 *
	 * @var bool
	 */
	protected $supports_multiple_values = false;

	protected $used_settings = [
		'number_type',
		'number_limits',
		'default_value',
	];

	/**
	 * The number type setting.
	 *
	 * @var string
	 */
	protected $number_type;

	/**
	 * The number limits setting.
	 *
	 * @var array
	 */
	protected $number_limits;

	/**
	 * The default value setting.
	 *
	 * @var string
	 */
	protected $default_value;

	/**
	 * Validate the filed value.
	 *
	 * @param mixed $value
	 * @param array $option_data
	 * @return WP_Error|true
	 */
	public function validate( $value, $option_data ) {
		$is_valid = parent::validate( $value, $option_data );

		if ( $is_valid instanceof WP_Error ) {
			return $is_valid;
		}

		if ( Conditional_Logic_Util::is_field_hidden( $this, $option_data ) ) {
			return true;
		}

		if ( ! $this->is_required() && empty( $value ) ) {
			return true;
		}

		if ( ! is_numeric( $value ) && $value !== '' ) {
			return new WP_Error( 'invalid_number', __( 'Please enter a valid number.', 'woocommerce-product-options' ) );
		}

		$min = $this->number_limits['min'] ?? '';

		if ( $min !== '' && $value < (float) $min ) {
			/* translators: %s: minimum number */
			return new WP_Error( 'invalid_number', sprintf( __( 'Please enter a number greater than or equal to %s.', 'woocommerce-product-options' ), $this->number_limits['min'] ) );
		}

		$max = $this->number_limits['max'] ?? '';

		if ( $max !== '' && $value > (float) $max ) {
			/* translators: %s: maximum number */
			return new WP_Error( 'invalid_number', sprintf( __( 'Please enter a number less than or equal to %s.', 'woocommerce-product-options' ), $this->number_limits['max'] ) );
		}

		$step = $this->number_limits['step'] ?? '';

		// Validate for step attribute.
		if ( $step !== '' && (float) $step > 0 ) {
			$float_division = ( $value - (float) $min ) / (float) $step;

			if ( bccomp( $float_division, round( $float_division ), 16 ) !== 0 ) {
				/* translators: %s: step value */
				return new WP_Error( 'invalid_number', sprintf( __( 'Please enter a valid number. The value must be in steps of %1$s, starting from %2$s.', 'woocommerce-product-options' ), $step, $min ) );
			}
		}

		return true;
	}

	/**
	 * Render the HTML for the field.
	 */
	public function render(): void {
		if ( ! $this->has_display_prerequisites() ) {
			return;
		}

		$this->render_field_wrap_open();

		$this->render_option_name();
		$this->render_input();
		$this->render_description();

		$this->render_field_wrap_close();
	}


	/**
	 * Render the HTML for the field input.
	 */
	private function render_input(): void {

		$html = sprintf(
			'<label for="%1$s" aria-label="%9$s">%5$s %6$s</label><input type="number" id="%1$s" name="%2$s" %3$s %4$s %7$s %8$s>',
			esc_attr( $this->get_input_id() ),
			esc_attr( $this->get_input_name() ),
			$this->get_choice_pricing_attributes(),
			$this->get_min_max_attributes(),
			$this->get_label(),
			$this->get_choice_pricing_string(),
			$this->is_required() ? 'required' : '',
			$this->get_value_attribute(),
			esc_attr( $this->get_label( 0, true ) )
		);

		// phpcs:reason This is escaped above.
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $html;
	}

	/**
	 * Gets the quantity limits for the field.
	 */
	private function get_min_max_attributes(): string {
		$attributes = [];

		$min = $this->number_limits['min'] ?? '';
		$max = $this->number_limits['max'] ?? '';

		if ( $min !== '' ) {
			$attributes['min'] = $min;
		}

		if ( $max !== '' ) {
			$attributes['max'] = $max;
		}

		$decimals           = $this->number_type === 'decimal' ? $this->get_setting( 'decimals', $this->get_default_decimals() ) : '0';
		$attributes['step'] = $this->get_setting( 'step', '' ) ?: 1 / pow( 10, (int) $decimals );
		$attribute_string   = Util::get_html_attribute_string( $attributes );

		return $attribute_string;
	}

	/**
	 * Return the default number of decimal places for a number field.
	 */
	private function get_default_decimals(): int {
		/**
		 * Filter to override the default number of decimal places for a number field
		 * when the `number_type` is set to `decimal`.
		 *
		 * Please note that returning zero (0) will make the field behave like an integer field
		 * as if the `number_type` was set to `whole`.
		 *
		 * @param int $decimals The default number of decimal places. Default is 3.
		 */
		return apply_filters( 'wc_product_options_get_number_default_decimals', 3 );
	}
}
