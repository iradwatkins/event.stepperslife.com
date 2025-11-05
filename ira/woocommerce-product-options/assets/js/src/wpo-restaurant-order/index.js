import { getModules, initModules } from '../wpo-single-product/module-loader';

( function ( $ ) {
	__webpack_public_path__ = window?.wpoSettings?.module_path_url;

	/**
	 * WooCommerce Restauarant Ordering (Custom init)
	 */
	$( document.body ).on( 'wro:modal:open', ( event ) => {
		const cartForms = jQuery( event.target ).find( 'form.cart' ).get();
		getModules().then( ( modules ) => {
			initModules( modules, cartForms );
		} ).catch( ( error ) => {
			console.error( error );
		} );
	} );
} )( jQuery );
