import { getModules, initModules } from '../wpo-single-product/module-loader';

( function ( $ ) {
	__webpack_public_path__ = window?.wpoSettings?.module_path_url;

	/**
	 * WooCommerce Quick View Pro
	 */
	$( document.body ).on( 'quick_view_pro:open', ( event, $modal ) => {
		const cartForms = [];
		$modal.find( 'form.cart' ).each( ( index, cartForm ) => {
			// Ensure the cart form is a valid form element
			if ( !( cartForm instanceof HTMLFormElement ) ) {
				return;
			}

			cartForms.push( cartForm );
		} );

		// Initialize modules for the cart form
		getModules().then( ( modules ) => {
			initModules( modules, cartForms );
		} ).catch( ( error ) => {
			console.error( error );
		} );
	} );
} )( jQuery );
