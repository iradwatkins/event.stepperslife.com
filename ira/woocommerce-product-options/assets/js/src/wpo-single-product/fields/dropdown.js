import { __ } from '@wordpress/i18n';
import NiceSelect from '@barn2plugins/nice-select2';

const dropdown = () => {
	function init() {
		Array.from( document.querySelectorAll( '.wpo-field-dropdown select:not(.initialized)' ) ).forEach(
			( select ) => {
				new NiceSelect(
					select,
					{
						placeholder: select.placeholder || __( 'Select an option', 'woocommerce-product-options' ),
						searchable: select.dataset.searchable === 'true' || select.querySelectorAll( 'option' ).length > 20,
						searchtext: __( 'Search', 'woocommerce-product-options' ),
						selectedtext: __( 'selected', 'woocommerce-product-options' ),
					}
				);
				select.classList.add( 'initialized' );
			}
		);
	}

	return { init };
};

export default dropdown();
