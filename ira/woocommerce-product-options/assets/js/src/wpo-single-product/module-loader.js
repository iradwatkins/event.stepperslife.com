import conditionalLogic from './conditional-logic';
import fieldValidation from './field-validation';
import priceCalculator from './price-calculator';
import wbvPriceCalculator from './integration/wbv-price-calculator';
import wdmOptionPrice from './integration/wdm-option-price';
// import ECESupport from './integration/ece-support';

export const getModules = ( selectorPrefix = '' ) => {
    return new Promise( ( resolve, reject ) => {
        const modulePromises = [];
        const modules = {};
        const typeModules = {
            checkbox: {
                type: 'checkbox',
                file: 'custom-checkboxes',
            },
            textLabels: {
                type: 'text_labels',
                file: 'custom-checkboxes',
            },
            dropdown: {
                type: 'dropdown',
                file: 'dropdown',
            },
            fileUpload: {
                type: 'file_upload',
                file: 'file-upload',
            },
            imageButtons: {
                type: 'image_buttons',
                file: 'image-buttons',
            },
            imageCheckboxes: {
                type: 'image_buttons',
                file: 'custom-checkboxes',
            },
            imageSwitcher: {
				selector: '.wpo-field-with-images',
                file: 'image-switcher',
            },
            datePicker: {
                type: 'datepicker',
                file: 'date-picker',
            },
            attributeOptions: {
                type: 'attribute_options',
                file: 'attribute-options',
				selector: '[data-variation-attribute]',
            },
        };
    
        Object.entries( typeModules ).forEach( ( [ key, type ] ) => {
			let selector = `${selectorPrefix} [data-type="${ type.type }"]`;

			if ( type.selector ) {
				selector = `${selectorPrefix} ${type.selector}`;
			}

			const fields = document.querySelectorAll( selector );
			if ( fields.length > 0 ) {
				modulePromises.push(
					import(
						/*webpackChunkName: "[request]"*/
						`./fields/${ type.file }`
					).then( ( module ) => {
						modules[ key ] = module.default;
					} )
				);
			}
        } );

        return Promise.all( modulePromises )
            .then( ( m ) => {
                resolve( modules );
            } )
            .catch( ( error ) => {
                reject( error );
            } );
    } );
};

export const getUsedOptionTypes = () => {
    return window.wpoUsedOptionTypes || [];
}

/**
 * General init helper.
 */
export const initModules = ( modules, cartForms = null ) => {
    modules?.dropdown?.init();
    modules?.checkbox?.init();
    modules?.textLabels?.init();
    modules?.datePicker?.init();
    modules?.imageCheckboxes?.init();
    modules?.imageSwitcher?.init();

	( cartForms || document.querySelectorAll( 'form.cart' ) ).forEach( ( cartForm ) => {
        conditionalLogic( cartForm ).init();
        fieldValidation( cartForm ).init();

        modules?.fileUpload?.( cartForm ).init();
        modules?.imageButtons?.( cartForm ).init();

        // check if this is a WBV cart form
        if ( cartForm.classList.contains( 'wcbvp-cart' ) ) {
            wbvPriceCalculator( cartForm ).init();
        } else {
            priceCalculator( cartForm ).init();
            modules?.attributeOptions?.( cartForm ).init();
        }

		wdmOptionPrice( cartForm ).init();

        // ECESupport( $, cartForm ).init();
    } );
}
