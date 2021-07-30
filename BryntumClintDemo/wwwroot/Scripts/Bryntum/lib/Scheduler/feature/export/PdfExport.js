import GridPdfExport from '../../../Grid/feature/export/PdfExport.js';
import GridFeatureManager from '../../../Grid/feature/GridFeatureManager.js';
import SchedulerExportDialog from '../../view/export/SchedulerExportDialog.js';
import SinglePageExporter from './exporter/SinglePageExporter.js';
import MultiPageExporter from './exporter/MultiPageExporter.js';
import MultiPageVerticalExporter from './exporter/MultiPageVerticalExporter.js';
import ObjectHelper from '../../../Core/helper/ObjectHelper.js';

/**
 * @module Scheduler/feature/export/PdfExport
 */

/**
 * Generates PDF/PNG files from the Scheduler component.
 *
 * <img src="resources/images/export-dialog.png" style="max-width : 300px" alt="Scheduler Export dialog">
 *
 * **NOTE:** Server side is required to make export work!
 *
 * The export server is written in nodejs and it is shipped with our examples.
 * How to start the server is described in `examples/_shared/server/README.md`
 * and `examples/export/README.md` files.
 *
 * When your server is up and running, it listens to requests. The Export feature sends a request to the specified URL
 * with the HTML fragments. The server generates a PDF file and returns a link to the file as a response.
 * Then the Export feature opens the link in a new tab and the file is automatically downloaded by your browser.
 * This is configurable, see {@link #config-openAfterExport} config.
 *
 * The {@link #config-exportServer} URL must be configured. The URL can be localhost if you start the server locally,
 * or your remote server address.
 *
 * ## Usage
 *
 * ```javascript
 * const scheduler = new Scheduler({
 *     features : {
 *         pdfExport : {
 *             exportServer : 'http://localhost:8080' // Required
 *         }
 *     }
 * })
 *
 * // Opens popup allowing to customize export settings
 * scheduler.features.pdfExport.showExportDialog();
 *
 * // Simple export
 * scheduler.features.pdfExport.export({
 *     columns : scheduler.columns.map(c => c.id) // Required, set list of column ids to export
 * }).then(result => {
 *     // Response instance and response content in JSON
 *     let { response, responseJSON } = result;
 * });
 * ```
 *
 * Appends configs related to exporting time axis: {@link #config-scheduleRange}, {@link #config-rangeStart},
 * {@link #config-rangeEnd}
 *
 * ## Loading resources
 *
 * If you face a problem with loading resources when exporting, the cause might be that the application and the export server are hosted on different servers.
 * This is due to [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS). There are 2 options how to handle this:
 * - Allow cross origin requests from the server where your export is hosted to the server where your application is hosted;
 * - Copy all resources keeping the folder hierarchy from the server where your application is hosted to the server where your export is hosted
 * and setup paths using {@link Grid.feature.export.PdfExport#config-translateURLsToAbsolute} config and configure the export server to give access to the path:
 *
 * ```javascript
 * const scheduler = new Scheduler({
 *     features : {
 *         pdfExport : {
 *             exportServer : 'http://localhost:8080',
 *             translateURLsToAbsolute : 'http://localhost:8080/resources' // '/resources' is hardcoded in WebServer implementation
 *         }
 *     }
 * })
 * ```
 *
 * ```javascript
 * // Following path would be served by this address: http://localhost:8080/resources/
 * node ./src/server.js -h 8080 -r web/application/styles
 * ```
 *
 * where `web/application/styles` is a physical root location of the copied resources, for example:
 *
 * <img src="resources/images/export-server-resources.png" style="max-width : 500px" alt="Export server structure with copied resources" />
 *
 * @extends Grid/feature/export/PdfExport
 * @feature
 * @typings Grid/feature/export/PdfExport -> Grid/feature/export/GridPdfExport
 */
export default class PdfExport extends GridPdfExport {
    static get $name() {
        return 'PdfExport';
    }

    static get defaultConfig() {
        return {
            exporters : [SinglePageExporter, MultiPageExporter, MultiPageVerticalExporter],

            /**
             * Specifies how to export time span.
             *  * completeview - Complete configured time span, from scheduler start date to end date
             *  * currentview  - Currently visible time span
             *  * daterange    - Use specific date range, provided additionally in config. See {@link #config-rangeStart}/
             *  {@link #config-rangeEnd}
             * @config {String}
             * @default
             * @group Export file config
             */
            scheduleRange : 'completeview',

            /**
             * Exported time span range start. Used with `daterange` config of the {@link #config-scheduleRange}
             * @config {Date}
             * @group Export file config
             */
            rangeStart : null,

            /**
             * Exported time span range end. Used with `daterange` config of the {@link #config-scheduleRange}
             * @config {Date}
             * @group Export file config
             */
            rangeEnd : null
        };
    }

    get defaultExportDialogConfig() {
        return ObjectHelper.copyProperties(super.defaultExportDialogConfig, this, ['scheduleRange']);
    }

    showExportDialog() {
        const me = this;

        if (!me.exportDialog) {
            me.exportDialog = SchedulerExportDialog.new({
                rootElement : me.rootElement,
                listeners   : {
                    export  : me.onExportDialogExport,
                    thisObj : me
                }
            }, me.defaultExportDialogConfig);
        }

        return me.exportDialog.show();
    }

    buildExportConfig(config) {
        config = super.buildExportConfig(config);

        const {
            scheduleRange,
            rangeStart,
            rangeEnd
        } = this;

        // Time axis is filtered from UI, need to append it
        if (config.columns && !config.columns.find(col => col.type === 'timeAxis')) {
            config.columns.push(config.client.timeAxisColumn.id);
        }

        return ObjectHelper.assign({
            scheduleRange,
            rangeStart,
            rangeEnd
        }, config);
    }
}

GridFeatureManager.registerFeature(PdfExport, false, 'Scheduler');
