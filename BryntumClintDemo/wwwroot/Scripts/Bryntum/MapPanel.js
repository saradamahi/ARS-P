/* eslint-disable no-unused-vars */
/* global mapboxgl */
import Panel from './lib/Core/widget/Panel.js';
import GlobalEvents from './lib/Core/GlobalEvents.js';
import DomHelper from './lib/Core/helper/DomHelper.js';

// NOTE: You must use your own Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY3Nvd2VsbC1hcnMiLCJhIjoiY2ttemJlejRqMGNiOTJvbW9sYzdiOXM0OSJ9.l3ZSngISvJZZhxOu0ZRiEA';

// A simple class containing a MapboxGL JS map instance
export default class MapPanel extends Panel {
    // Factoryable type name
    static get type() {
        return 'mappanel';
    }

    // Reguired to store class name for IdHelper and bryntum.query in IE11
    static get $name() {
        return 'MapPanel';
    }

    static get defaultConfig() {
        return {
            layout: 'fit',
            monitorResize: true,
            // Some defaults of the initial map display
            zoom: 10,
            lat: 35.15874,
            lon: -89.74324,

            //// Toolbar buttons
            tbar: [
            //    {
            //        type: 'widget',
            //        cls: 'widget-title',
            //        html: 'Map View',
            //        flex: 1
            //    },
            //    {
            //        type: 'buttonGroup',
            //        ref: 'themeGroup',
            //        items: ['Stockholm', 'Classic-Dark'].map(name => {
            //            const
            //                isLight = name.toLowerCase() === 'stockholm',
            //                themeIsLight = !DomHelper.themeInfo.name.toLowerCase().match('dark');

            //            return {
            //                id: name.toLowerCase(),
            //                text: isLight ? 'Light' : 'Dark',
            //                pressed: isLight ? themeIsLight : !themeIsLight,
            //                enableToggle: true,
            //                toggleGroup: 'theme',
            //                onAction({ source: button }) {
            //                    DomHelper.setTheme(button.id);
            //                }
            //            };
            //        })
            //    },
            //    {
            //        type: 'buttongroup',
            //        items: [
                        {
                            icon: 'b-fa b-fa-plus',
                            onClick: 'up.onZoomIn'
                        },
                        {
                            icon: 'b-fa b-fa-minus',
                            onClick: 'up.onZoomOut'
                        }
            //        ]
            //    }
            ]
        };
    }

    onZoomIn() {
        this.map.zoomIn();
    }

    onZoomOut() {
        this.map.zoomOut();
    }

    construct() {
        const me = this;

        super.construct(...arguments);

        me.element.addEventListener('click', me.onMapClick.bind(me));

        const mapEl = DomHelper.createElement({
            parent: me.bodyElement
        });

        // NOTE: You must use your own Mapbox access token
        me.map = new mapboxgl.Map({
            container: mapEl,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [me.lon, me.lat],
            zoom: me.zoom
        });

        // First load the map and then setup our event listeners for store CRUD and time axis changes
        me.map.on('load', () => {
            mapEl.classList.add('maploaded');

            me.eventStore.on('change', me.onStoreChange, me);
            me.timeAxis.on('reconfigure', me.onTimeAxisReconfigure, me);

            // If data loaded before the map, trigger onStoreChange manually
            if (me.eventStore.count) {
                me.onStoreChange({ action: 'dataset', records: me.eventStore.records });
            }
        });

        // Switch to dark maps for dark theme
        GlobalEvents.on({
            theme: 'onThemeChange',
            thisObj: me
        });
    }

    setMapStyle() {
        const
            isDark = DomHelper.themeInfo.name.toLowerCase().includes('dark'),
            mapStyle = isDark ? 'dark-v10' : 'streets-v11';

        this.map.setStyle('mapbox://styles/mapbox/' + mapStyle);
    }

    // When data changes in the eventStore, update the map markers accordingly
    onStoreChange(event) {
        switch (event.action) {
            case 'add':
            case 'dataset':
                if (event.action === 'dataset') {
                    this.removeAllMarkers();
                }
                event.records.forEach(eventRecord => this.addEventMarker(eventRecord));
                break;

            case 'remove':
                event.records.forEach(event => this.removeEventMarker(event));
                break;

            case 'update': {
                const eventRecord = event.record;

                this.removeEventMarker(eventRecord);
                this.addEventMarker(eventRecord);

                break;
            }

            case 'filter': {
                const renderedMarkers = [];

                this.eventStore.query(rec => rec.marker, true).forEach(eventRecord => {
                    if (!event.records.includes(eventRecord)) {
                        this.removeEventMarker(eventRecord);
                    }
                    else {
                        renderedMarkers.push(eventRecord);
                    }
                });

                event.records.forEach(eventRecord => {
                    if (!renderedMarkers.includes(eventRecord)) {
                        this.addEventMarker(eventRecord);
                    }
                });

                break;
            }
        }
    }

    // Only show markers for events inside currently viewed time axis
    onTimeAxisReconfigure({ source: timeAxis }) {
        this.eventStore.forEach(eventRecord => {
            this.removeEventMarker(eventRecord);
            this.addEventMarker(eventRecord);
        });
    }

    // Puts a marker on the map, if it has lat/lon specified + the timespan intersects the time axis
    addEventMarker(eventRecord) {
        if (!eventRecord.address) return;

        const { lat, lon } = eventRecord.address;

        if (lat && lon && this.timeAxis.isTimeSpanInAxis(eventRecord)) {
            const
                color = eventRecord.eventColor || eventRecord.resource?.eventColor || '#f0f0f0',
                marker = new mapboxgl.Marker({
                    color
                })
                    .setLngLat([lon, lat])
                    .addTo(this.map);

            marker.getElement().id = eventRecord.id;

            eventRecord.marker = marker;
            marker.eventRecord = eventRecord;
            marker.addTo(this.map);
        }
    }

    removeEventMarker(eventRecord) {
        const marker = eventRecord.marker;

        if (marker) {
            marker.popup && marker.popup.remove();
            marker.popup = null;
            marker.remove();
        }
        eventRecord.marker = null;
    }

    removeAllMarkers() {
        this.eventStore.forEach(eventRecord => this.removeEventMarker(eventRecord));
    }

    scrollMarkerIntoView(eventRecord) {
        const marker = eventRecord.marker;

        this.map.easeTo({
            center: marker.getLngLat()
        });
    }

    showTooltip(eventRecord, centerAtMarker) {
        const
            me = this,
            marker = eventRecord.marker;

        me.popup && me.popup.remove();

        if (centerAtMarker) {
            me.scrollMarkerIntoView(eventRecord);
        }

        const popup = me.popup = marker.popup = new mapboxgl.Popup({
            offset: 25
        });

        popup.setLngLat(marker.getLngLat());
        popup.setHTML(`<span class="event-name">${eventRecord.name}</span><span class="location"><i class="b-fa b-fa-map-marker-alt"></i>${eventRecord.shortAddress}<span>`);
        popup.addTo(me.map);
    }

    onMapClick({ target }) {
        const markerEl = target.closest('.mapboxgl-marker');

        if (markerEl) {
            const eventRecord = this.eventStore.getById(markerEl.id);

            this.showTooltip(eventRecord);
            this.trigger('markerclick', { marker: eventRecord.marker, eventRecord });
        }
    }

    onResize() {
        // This widget was resized, so refresh the Mapbox map
        this.map?.resize();
    }

    onThemeChange({ theme }) {
        const buttonIndex = theme.toLowerCase().match('dark') ? 1 : 0;

        this.setMapStyle(theme);

        this.tbar.widgetMap.themeGroup.items[buttonIndex].pressed = true;
    }
};

// Register this widget type with its Factory
MapPanel.initClass();
