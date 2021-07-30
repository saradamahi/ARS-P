import Column from '../../Grid/column/Column.js';
import ColumnStore from '../../Grid/data/ColumnStore.js';
import Scale from '../../Core/widget/graph/Scale.js';

/**
 * @module SchedulerPro/column/ScaleColumn
 */

/**
 * A specialised column showing a graduated scale from a defined array of values
 * and labels. This column is used in the {@link SchedulerPro.view.ResourceHistogram} and is not editable. Normally
 * You should not need to interact with this class directly.
 *
 * @extends Grid/column/Column
 * @classType scale
 */
export default class ScaleColumn extends Column {

    //region Config

    static get $name() {
        return 'ScaleColumn';
    }

    static get type() {
        return 'scale';
    }

    static get isScaleColumn() {
        return true;
    }

    static get fields() {
        return [
            'scalePoints'
        ];
    }

    static get defaults() {
        return {
            text        : '\xa0',
            width       : 40,
            minWidth    : 40,
            cellCls     : 'b-scale-cell',
            editor      : false,
            sortable    : false,
            groupable   : false,
            filterable  : false,
            scalePoints : [
                {
                    value : 4
                },
                {
                    value : 8,
                    text  : 8
                }
            ]
        };
    }

    //endregion

    //region Constructor/Destructor

    onDestroy() {
        this.scaleWidget.destroy();
    }

    //endregion

    //region Internal

    set width(width) {
        super.width = width;
        this.scaleWidget.width = width;
    }

    get width() {
        return super.width;
    }

    applyValue(useProp, key, value) {
        // pass value to scaleWidget
        if (key === 'scalePoints') {
            this.scaleWidget[key] = value;
        }

        return super.applyValue(...arguments);
    }

    get scaleWidget() {
        const me = this;

        if (!me._scaleWidget) {
            me._scaleWidget = new Scale({
                owner         : me.grid,
                appendTo      : me.grid.floatRoot,
                cls           : 'b-hide-offscreen',
                align         : 'right',
                scalePoints   : me.scalePoints,
                monitorResize : false
            });
            Object.defineProperties(me._scaleWidget, {
                width : {
                    get() {
                        return me.width;
                    },
                    set(width) {
                        this.element.style.width = `${width}px`;
                        this._width = me.width;
                    }
                },
                height : {
                    get() {
                        return this._height;
                    },
                    set(height) {
                        this.element.style.height = `${height}px`;
                        this._height = height;
                    }
                }
            });
            me._scaleWidget.width = me.width;
        }
        return me._scaleWidget;
    }

    //endregion

    //region Render

    renderer({ cellElement }) {
        const
            { scaleWidget } = this;

        scaleWidget.height = this.grid.rowHeight;
        scaleWidget.refresh();

        // Clone the scale widget element since every row is supposed to have
        // the same scale settings
        const scaleCloneElement = scaleWidget.element.cloneNode(true);
        scaleCloneElement.removeAttribute('id');
        scaleCloneElement.classList.remove('b-hide-offscreen');

        cellElement.innerHTML = '';
        cellElement.appendChild(scaleCloneElement);
    }

    //endregion

}

ColumnStore.registerColumnType(ScaleColumn);
