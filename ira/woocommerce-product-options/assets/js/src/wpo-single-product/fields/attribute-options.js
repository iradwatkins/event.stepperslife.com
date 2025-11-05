import { __ } from '@wordpress/i18n';

import { getFieldInputType, isFieldCheckboxLike, isFieldRadioLike, isFieldType } from '../util.js';

const attributeOptions = function ( addToCartForm ) {
	const form = addToCartForm;
	const $ = window.jQuery;
	let fieldData;
	let variationAttributes;

	function init() {
		if ( ! ( form instanceof HTMLFormElement ) ) {
			return false;
		}

		if (
			! [ 'variations_form', 'wpt_variations_form' ].some( ( className ) => form.classList.contains( className ) )
		) {
			return false;
		}

		setupVars();

		if ( fieldData.length === 0 ) {
			return false;
		}

		bindEvents();

		checkPreselectedValues();
		maybeSetFromUrl();
	}

	function setupVars() {
		fieldData = Array.from( form.querySelectorAll( '.wpo-field' ) )
			.map( ( field ) => {
				return {
					element: field,
					inputElements: field.querySelectorAll( getFieldInputType( field.dataset.type ) ),
					type: field.dataset?.type,
					variationAttribute: field.dataset?.variationAttribute,
				};
			} )
			.filter( ( field ) => field.variationAttribute );

		variationAttributes = fieldData.map( ( field ) => field.variationAttribute );
	}

	function bindEvents() {
		// Sync the value into the hidden WooCommerce core attribute dropdown
		fieldData.forEach( ( field ) => {
			field?.element.addEventListener( 'change', (event) => syncVariationDropdown( event, field ) );
		} );

		// Bind the reset data button
		form.querySelector( '.reset_variations' )?.addEventListener( 'click', handleReset );

		// Include or exclude available attribute terms
		$( form ).on( 'woocommerce_update_variation_values', syncAvailableAttributes );

		// Check for the reset_variations button status
		$( form ).on( 'check_variations', showHideClearButtonContainer );
	}

	function checkPreselectedValues() {
		let hasPreselectedValue = false;

		fieldData.forEach( ( field ) => {
			field.inputElements.forEach( ( input ) => {
				if ( isFieldCheckboxLike( field.type ) || isFieldRadioLike( field.type ) ) {
					if ( input.checked ) {
						hasPreselectedValue = true;
						// Sync with core variation dropdown
						syncVariationDropdown( { target: input }, field );
					}
				} else if ( field.type === 'dropdown' ) {
					if ( input.value ) {
						hasPreselectedValue = true;
						// Sync with core variation dropdown
						syncVariationDropdown( { target: input }, field );
					}
				}
			} );
		} );

		// If we found any preselected values, trigger variation check
		if ( hasPreselectedValue ) {
			$( form ).find( '.variations select' ).trigger( 'change.wc-variation-form' )
		}
	}

	/**
	 * Set the variation attributes from the URL.
	 */
	function maybeSetFromUrl() {
		const url = new URL( window.location.href );

		// check any variation attributes are in the URL Search Params
		variationAttributes?.forEach( ( attribute ) => {
			const attributeValue = url.searchParams.get( `attribute_${ attribute }` );

			if ( ! attributeValue ) {
				return;
			}

			const field = fieldData.find( ( field ) => field.variationAttribute === attribute );

			if ( ! field ) {
				return;
			}

			// Select our input with the matching attribute value as dataset.attributeTerm
			if ( isFieldCheckboxLike( field.type ) || isFieldRadioLike( field.type ) ) {
				field.inputElements.forEach( ( input ) => {
					input.checked = input.dataset.attributeTerm === attributeValue;
				} );
			} else if ( field.type === 'dropdown' ) {
				// Find and select the matching option
				const select = field.inputElements[ 0 ];
				const option = Array.from( select.options ).find(
					( opt ) => opt.dataset.attributeTerm === attributeValue
				);

				if ( option ) {
					select.value = option.value;
				}
			}
		} );

		checkPreselectedValues();
	}

	/**
	 * Sync the value into the hidden WooCommerce core attribute dropdown.
	 *
	 * @param {Event} event
	 * @param {Object} field
	 * @returns
	 */
	function syncVariationDropdown( event, field ) {
		let attributeTerm;

		if ( field.type === 'dropdown' ) {
			attributeTerm = event.target.options?.[ event.target.selectedIndex ]?.dataset?.attributeTerm ?? null;
			updateNiceSelect( field.inputElements[ 0 ] );
		} else {
			attributeTerm = event.target.dataset?.attributeTerm ?? null;
		}

		if ( attributeTerm === null ) {
			return;
		}

		const coreVariationDropdown = form.querySelector( `select[name="attribute_${ field.variationAttribute }"]` );

		if ( coreVariationDropdown === null ) {
			return;
		}

		coreVariationDropdown.value = attributeTerm;

		$( coreVariationDropdown ).trigger( 'change' );
	}

	/**
	 * Handle using the WooCommerce core reset button.
	 */
	function handleReset() {
		fieldData.forEach( ( field ) => {
			field.inputElements.forEach( ( input ) => {
				if ( isFieldCheckboxLike( field.type ) || isFieldRadioLike( field.type ) ) {
					input.checked = false;
				} else if ( field.type === 'dropdown' ) {
					input._niceSelect?.clear();
				}
			} );
		} );
	}

	/**
	 * Sync the available options from the hidden WooCommerce core attribute dropdown to the visible WPO fields.
	 */
	function syncAvailableAttributes() {
		const coreAttributeDropdowns = variationAttributes.map( ( attribute ) => {
			return form.querySelector( `select[name="attribute_${ attribute }"]` );
		} );

		const availableAttributes = Object.fromEntries(
			variationAttributes.map( ( attribute, index ) => {
				const dropdown = coreAttributeDropdowns?.[ index ];

				const values = Array.from( dropdown.options )
					.filter( ( option ) => ! option.disabled && option.value )
					.map( ( option ) => option.value );

				return [ attribute, values ];
			} )
		);

		// Update the custom fields based on available attributes
		fieldData.forEach( ( field ) => {
			const availableOptions = availableAttributes[ field.variationAttribute ] ?? [];

			if ( ! availableOptions.length ) {
				return;
			}

			// if we have a select field, we need to grab the options
			const inputElements =
				field.type === 'dropdown' ? Array.from( field.inputElements[ 0 ].options ) : field.inputElements;

			inputElements.forEach( ( input ) => {
				if ( availableOptions.includes( input.dataset.attributeTerm ) ) {
					showFieldInput( input, field );
				} else {
					hideFieldInput( input, field );
				}
			} );

			if ( field.type === 'dropdown' ) {
				updateNiceSelect( field.inputElements[ 0 ] );
			}
		} );
	}

	function showHideClearButtonContainer() {
		const resetButton = form.querySelector( '.reset_variations' );
		const variationsTable = resetButton?.closest( '.variations' );

		if ( ! variationsTable ) {
			// Either no variations or no reset button, so we stop here
			return;
		}

		// Get all variation select elements that are not rendered as WPO fields
		const selects = variationsTable.querySelectorAll( 'select' );

		// If there are no selects and the reset button is not visible, hide the variations table
		const isVariationsTableEmpty = selects.length === 0 && resetButton?.getBoundingClientRect().width === 0;
		variationsTable.style.display = isVariationsTableEmpty ? 'none' : 'table';
	}

	/**
	 * Hide, clear and disable the input.
	 *
	 * @param {HTMLInputElement} input
	 * @param {Object} field
	 */
	function hideFieldInput( input, field ) {
		if ( isFieldCheckboxLike( field ) || isFieldRadioLike( field ) ) {
			const typeInputContainer = input.closest( getFieldInputContainerClass( field ) );
			typeInputContainer?.classList?.add( 'wpo-field-hide' );

			input.disabled = true;
			input.checked = false;
		}

		if ( isFieldType( field, 'dropdown' ) ) {
			if ( input.value ) {
				input.disabled = true;
				input.selected = false;
			}
		}
	}

	/**
	 * Show and enable the input.
	 *
	 * @param {HTMLInputElement} input
	 * @param {Object} field
	 */
	function showFieldInput( input, field ) {
		input.disabled = false;

		if ( isFieldCheckboxLike( field ) || isFieldRadioLike( field ) ) {
			const typeInputContainer = input.closest( getFieldInputContainerClass( field ) );
			typeInputContainer?.classList?.remove( 'wpo-field-hide' );
		}
	}

	/**
	 * Update or create the NiceSelect instance.
	 *
	 * @param {HTMLSelectElement} selectElement
	 */
	function updateNiceSelect( selectElement ) {
		if ( selectElement.selectedIndex === 0 ) {
			selectElement.selectedIndex = -1;
		}

		if ( selectElement.selectedIndex === -1 ) {
			$( form ).trigger( 'reset_data' );
		} else {
			selectElement._niceSelect?.update();
		}
	}

	/**
	 * Get the CSS class for the input container.
	 *
	 * @param {Object} field
	 * @return {string}
	 */	
	function getFieldInputContainerClass( field ) {
		const typeInputContainerMap = {
			checkbox: '.wpo-checkbox',
			radio: '.wpo-radio',
			image_buttons: '.wpo-image-button',
			text_labels: '.wpo-text-label',
			color_swatches: '.wpo-color-checkbox',
		};

		return typeInputContainerMap?.[ field.type ];
	}

	return { init };
};

export default attributeOptions;
