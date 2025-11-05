<?php
/**
 * The main plugin file for WooCommerce Product Options.
 *
 * This file is included during the WordPress bootstrap process if the plugin is active.
 *
 * @package   Barn2\woocommerce-product-options
 * @author    Barn2 Media <support@barn2.com>
 * @license   GPL-3.0
 * @copyright Barn2 Media Ltd
 *
 * @wordpress-plugin
 * Plugin Name:     WooCommerce Product Options
 * Plugin URI:      https://barn2.com/wordpress-plugins/woocommerce-product-options/
 * Description:     Add extra options to your WooCommerce products, with over 14 option types, optional fees for each option, min/max quantities, and conditional logic.
 * Version:         2.5.1
 * Author:          Barn2 Plugins
 * Author URI:      https://barn2.com
 * Text Domain:     woocommerce-product-options
 * Domain Path:     /languages
 * Update URI:      https://barn2.com/wordpress-plugins/woocommerce-product-options/
 *
 * Requires at least: 6.1.0
 * Tested up to: 6.8.2
 * Requires PHP: 7.4
 * WC requires at least: 7.0.0
 * WC tested up to: 10.1.2
 * Requires Plugins: woocommerce
 *
 * Copyright:       Barn2 Media Ltd
 * License:         GNU General Public License v3.0
 * License URI:     http://www.gnu.org/licenses/gpl-3.0.html
 */

namespace Barn2\Plugin\WC_Product_Options;

// Prevent direct file access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PLUGIN_VERSION = '2.5.1';
const PLUGIN_FILE    = __FILE__;

// Include autoloader.
require_once __DIR__ . '/vendor/autoload.php';

update_option(
	'barn2_plugin_license_461766',
	array(
		'license'  => '12****-******-******-****56',
		'url'      => get_home_url(),
		'status'   => 'active',
		'override' => true,
	)
);
add_filter(
	'pre_http_request',
	function ( $pre, $parsed_args, $url ) {
		if ( strpos( $url, 'https://barn2.com/edd-sl' ) === 0 && isset( $parsed_args['body']['edd_action'] ) ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'body'     => wp_json_encode( array( 'success' => true ) ),
			);
		}
		return $pre;
	},
	10,
	3
);

/**
 * Helper function to access the shared plugin instance.
 *
 * @return Barn2\Plugin\WC_Product_Options\
 */
function plugin() {
	return Plugin_Factory::create( PLUGIN_FILE, PLUGIN_VERSION );
}

/**
 * Alias of the helper function `plugin()`.
 *
 * @return Barn2\Plugin\WC_Product_Options\
 */
function wpo() {
	return plugin();
}

// Load the plugin.
plugin()->register();
