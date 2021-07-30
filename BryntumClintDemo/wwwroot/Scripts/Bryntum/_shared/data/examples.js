/**
 * folder  : example folder under ./examples
 * group   : browser page group
 * title   : example title
 * build   : true if example needs building
 * offline : true if example is not available online
 * since   : package version since example is available
 * ie      : false if not supported for IE
 * edge    : false if not supported for Edge
 */

// Prepare Schuler examples
window.examples?.forEach(e => {
    e.rootFolder = '../examples-scheduler/';
});

// The file should be included after examples.js from Scheduler
window.examples = [].concat([
    { folder : 'bigdataset', group : 'Pro', title : 'Big data set (pro-version)', version : 'Pro' },
    { folder : 'constraints', group : 'Pro', title : 'Constraints that affect scheduling', version : 'Pro' },
    { folder : 'dependencies', group : 'Pro', title : 'Dependencies affecting scheduling', version : 'Pro' },
    { folder : 'drag-from-grid', group : 'Pro', title : 'Drag tasks from a grid', version : 'Pro' },
    { folder : 'drag-batches', group : 'Pro', title : 'Drag orders to schedule batches of tasks', version : 'Pro', since : '4.0.8' },
    { folder : 'grouping', group : 'Pro', title : 'Group resources by any field', version : 'Pro' },
    { folder : 'maps', group : 'Pro', title : 'Map integration', version : 'Pro', since : '4.0' },
    { folder : 'nested-events', group : 'Pro', title : 'Nested events with drag-n-drop support', version : 'Pro', since : '4.0' },
    { folder : 'non-working-time', group : 'Pro', title : 'Visualize and filter out non-working time', version : 'Pro' },
    { folder : 'percent-done', group : 'Pro', title : 'Event progress using percent done', version : 'Pro' },
    { folder : 'resource-non-working-time', group : 'Pro', title : 'Using resource calendars', version : 'Pro' },
    { folder : 'resourcehistogram', group : 'Pro', title : 'Resource histogram', version : 'Pro' },
    { folder : 'taskeditor', group : 'Pro', title : 'Task editor customization', version : 'Pro' },
    { folder : 'timeline', group : 'Pro', title : 'Scheduler Pro with Timeline widget', version : 'Pro', since : '4.0' },
    { folder : 'weekends', group : 'Pro', title : 'Showing and respecting weekends', version : 'Pro' },
    { folder : 'webcomponents', group : 'Integration/Pro', title : 'Use as web component' },
    { folder : 'salesforce', group : 'Integration/Pro', title : 'Integrate with Salesforce Lightning (offline)', offline : true, since : '4.0' },
    { folder : 'extjsmodern', group : 'Integration/Pro', title : 'ExtJS Modern App integration demo', version : 'ExtJS 7.2.0', since : '4.0' },
    { folder : 'frameworks/custom-build', group : 'Integration/Pro', title : 'Custom build using WebPack',  version : 'WebPack 4', offline : true },
    { folder : 'frameworks/angular/resource-histogram', group : 'Integration/Pro', title : 'Angular Pro Resource Histogram demo', version : 'Angular 10', build : true },
    { folder : 'frameworks/react/javascript/resource-histogram', group : 'Integration/Pro', title : 'React Pro Resource Histogram demo', version : 'React 16.13', build : true },
    { folder : 'frameworks/react/javascript/timeline', group : 'Integration/Pro', title : 'React Pro Timeline demo', version : 'React 17', since : '4.1', build : true },
    { folder : 'frameworks/vue/javascript/resource-histogram', group : 'Integration/Pro', title : 'Vue Pro Resource Histogram demo', version : 'Vue 2.6', build : true },
    { folder : 'frameworks/vue/javascript/vue-renderer', group : 'Integration/Pro', title : 'Vue Pro Cell Renderer demo', version : 'Vue 2.6', build : true, since : '4.1.0' },
    { folder : 'frameworks/vue-3/javascript/resource-histogram', group : 'Integration/Pro', title : 'Vue 3 Pro Resource Histogram demo', version : 'Vue 3.0', build : true, since : '4.1' }

], ...window.examples);

// Filter demos by browser
window.examples = window.examples.filter(e => e[window._isIE11 ? 'ie' : window._isEdge ? 'edge' : null] !== false);
