/**
 * Internal dependencies.
 */
import { discountOptionPrice } from '../price-util.js';

const wdmOptionPrice = ( cartForm ) => {
	const init = () => {
		if ( ! ( cartForm instanceof HTMLFormElement ) ) {
			return false;
		}

		bindEvents();
	};

	const bindEvents = () => {
		document.querySelectorAll( '.wdm-bundle-radio' ).forEach( ( bundleItem ) => {
			bundleItem.addEventListener( 'change', () => {
				let discount = parseFloat( bundleItem.dataset.discountValue ) / 100;

				if ( bundleItem.dataset.discountType === 'value' ) {
					discount = parseFloat( bundleItem.dataset.discountValue ) / ( parseFloat( bundleItem.dataset.totalAmount ) + parseFloat( bundleItem.dataset.discountValue ) );
				}

				cartForm.querySelectorAll( '.wpo-field' ).forEach( ( field ) => {
					discountOptionPrice( field, discount );
				} );
				
			} );
		} );
	};

	return { init };
};

export default wdmOptionPrice;