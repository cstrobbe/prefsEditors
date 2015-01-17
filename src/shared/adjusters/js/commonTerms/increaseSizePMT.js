/*!
Cloud4all Preferences Management Tools

Copyright 2013-2014 OCAD University
Copyright 2013 CERTH/HIT

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/GPII/prefsEditors/LICENSE.txt
*/

(function ($, fluid) {
    "use strict";
    
    fluid.defaults("gpii.panel.increaseSizePMT", {
        gradeNames: ["gpii.panel.increaseSizePCP", "gpii.panel.expandingAdjusters", "autoInit"],
        model: {
            moreLessEnabledSwitch: false
        },
        protoTree: {
            increaseSizeHeader: {messagekey: "increaseSizeHeader"},
            appearanceHeading: {messagekey: "appearance"},
            magnifierHeading:  {messagekey: "magnifier"}
        },
        selectors: {
            magnifierControlsContainer: ".gpiic-prefsEditor-magnifier-container",
            expandingAdjusters: ".gpiic-magnifier-hidden",
            moreLess: ".gpiic-magnifier-category",
            elementToFocusOnExpansion: "input[name='gpii_primarySchema_magnificationPosition_magnifierPosition-radio']:checked",
            increaseSection: ".gpiic-increaseSize-section"
        },
        selectorsToIgnore: ["magnifierControlsContainer", "elementToFocusOnExpansion", "increaseSection"],
        listeners: {
            "afterRender.setSectionName": {
                "this": "{that}.dom.increaseSection",
                "method": "attr",
                "args": ["aria-label", "{that}.msgLookup.increaseSizeHeader"]
            },
            "afterRender.setAriaLabel": {
                "this": "{that}.dom.moreLess",
                "method": "attr",
                "args": ["aria-label", "{that}.setMagnifierAriaMoreLess"]
            },
            "afterRender.setExpandedAriaLabel": {
                "this": "{that}.dom.expandingAdjusters",
                "method": "attr",
                "args": ["aria-label", "{that}.msgLookup.additionalMagnifierAdjusters"]
            },
            "afterRender.setContainerAriaLabel": {
                "this": "{that}.dom.magnifierControlsContainer",
                "method": "attr",
                "args": ["aria-label", "{that}.msgLookup.additionalMagnifierAdjusters"]
            },
            "afterRender.setContainerAriaRelevant": "{that}.setAriaRelevant"
        },
        invokers: {
            // override this invoker to use the "magnifierEnabled" model value
            toggleMoreLessInstant: {
                "funcName": "gpii.panel.expandingAdjusters.showOrHideDependingOnState",
                "args": [
                    "{that}.model.gpii_primarySchema_magnifierEnabled",
                    "{that}.events.onShowMoreLess.fire",
                    "{that}.events.onHideMoreLess.fire",
                    0
                ],
                dynamic: true
            },
            setAriaRelevant: {
                funcName: "gpii.ariaUtility.setAriaRelevant",
                args: ["{that}.dom.magnifierControlsContainer", "{that}.model.gpii_primarySchema_magnifierEnabled"],
                dynamic: true

            },
            setMagnifierAriaMoreLess: {
                "funcName": "gpii.ariaUtility.setAriaMoreLess",
                "args": ["{that}.model.expandingAdjustersEnabledSwitch",
                         "{that}.msgLookup.moreMagnifierPreferences",
                         "{that}.msgLookup.lessMagnifierPreferences"
                        ],
                "dynamic": true
            }
        }
    });

})(jQuery, fluid);
