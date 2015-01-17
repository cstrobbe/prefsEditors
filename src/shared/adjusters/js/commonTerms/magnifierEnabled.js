/*!
Cloud4all Preferences Management Tools

Copyright 2013 CERTH/HIT
Copyright 2014 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/GPII/prefsEditors/LICENSE.txt
*/

(function ($, fluid) {
    "use strict";
    
    fluid.defaults("gpii.adjuster.magnifierEnabled", {
        gradeNames: ["gpii.adjuster.onOffSwitch", "autoInit"],
        mergePolicy: {
            selectorsToIgnore: fluid.prefs.compositePanel.arrayMergePolicy
        },
        preferenceMap: {
            "gpii.primarySchema.magnifierEnabled": {
                "model.value": "default"
            }
        },
        events: {
            onAdjusterChange: "{prefsEditor}.events.onAdjusterChange"
        },
        modelListeners: {
            "*": {
                "listener": "{that}.events.onAdjusterChange.fire"
            }
        },
        protoTree: {
            headingLabel: {messagekey: "magnifierLabel"},
            valueCheckbox: "${value}"
        },
        onOffModelKey: "value",
        listeners: {
            "onDomBind.addAriaControls": {
                "this": "{that}.dom.valueCheckbox",
                "method": "attr",
                "args": ["aria-controls", "{that}.options.ariaControls"]
            }
        }
    });

})(jQuery, fluid);
