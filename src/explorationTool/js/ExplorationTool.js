/*
Copyright 2013 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global demo:true, fluid, gpii, jQuery, window*/

// JSLint options
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

(function ($, fluid) {

    fluid.registerNamespace("gpii.explorationTool");

    // Used for graceful degradation instead of progressive enhancement,
    // since we do not know ahead of time which enactors will be used. (e.g. if/when we switch to schema.)
    // Currently just checking if wav files are supported as that is the only file type that is returned from
    // the tts server. In the future should switch to "buzz.isSupported", when the tts server returns other
    // supported file types.
    gpii.explorationTool.isHTML5AudioNotSupported = function () {
        return !buzz.isWAVSupported();
    };
    fluid.enhance.check({
        "fluid.HTML5Audio.NotSupported": "gpii.explorationTool.isHTML5AudioNotSupported"
    });

    /**
     * These paths will need to be customized for the integration
     */
    fluid.defaults("gpii.explorationTool.templateLoader", {
        gradeNames: ["fluid.uiOptions.resourceLoader", "autoInit"],
        templates: {
            highContrast: "%prefix/HighContrastPanelTemplate.html",
            lowContrast: "%prefix/LowContrastPanelTemplate.html",
            increaseSize: "%prefix/IncreaseSizePanelTemplate.html",
            simplify: "%prefix/SimplifyPanelTemplate.html",
            moreText: "%prefix/MoreTextPanelTemplate.html",
            spoken: "%prefix/SpokenPanelTemplate.html",
            uiOptions: "%prefix/ExplorationTool.html"
        }
    });

    fluid.defaults("gpii.explorationTool.messageLoader", {
        gradeNames: ["fluid.uiOptions.resourceLoader", "autoInit"],
        templates: {
            uiOptions: "%prefix/ExplorationTool.json"
        }
    });

    fluid.defaults("gpii.explorationTool.rootModel", {
        gradeNames: ["fluid.uiOptions.rootModel", "autoInit"],
        members: {
            rootModel: {
                highContrast: false,
                lowContrast: false,
                increaseSize: false,
                simplify: false,
                moreText: false,
                spoken: false,

                textFont: "default",
                theme: "default",
                textSize: 1,
                lineSpace: 1,
                toc: false,
                links: false,
                inputsLarger: false,
                simplifyContent: false,
                showMoreText: false,
                selfVoicing: false
            }
        }
    });

    /*****************
     * The Exploration Tool
     * An instance of a Fat Panel UIO
     ****************/
    fluid.defaults("gpii.explorationTool", {
        gradeNames: ["fluid.uiOptions.fatPanel", "autoInit"],
        selectors: {
            explorationIcon: ".flc-icon-explorationTool"
        },
        keyBinding: {
            hideTool: $.ui.keyCode.ESCAPE
        },
        slidingPanel: {
            strings: {
                showLabel: {
                    expander: {
                        func: "gpii.explorationTool.lookupMsg",
                        args: ["{slidingPanel}.msgBundle", "slidingPanelShowLabel"]
                    }
                },
                hideLabel: {
                    expander: {
                        func: "gpii.explorationTool.lookupMsg",
                        args: ["{slidingPanel}.msgBundle", "slidingPanelHideLabel"]
                    }
                }
            },
            invokers: {
                showExplorationIcon: {
                    "this": "{explorationTool}.dom.explorationIcon",
                    method: "show",
                    args: [0]
                },
                hideExplorationIcon: {
                    "this": "{explorationTool}.dom.explorationIcon",
                    method: "hide",
                    args: [0]
                },
                setLabel: {
                    "this": "{that}.dom.toggleButton",
                    method: "attr",
                    args: ["aria-label", "{arguments}.0"]
                },
                setExpanded: {
                    "this": "{that}.dom.panel",
                    method: "attr",
                    args: ["aria-expanded", "{arguments}.0"]
                }
            },
            listeners: {
                "onCreate.showIcon": "{that}.showExplorationIcon",
                "onCreate.showLabel": {
                    listener: "{that}.setLabel",
                    args: "{that}.options.strings.showLabel"
                },
                "onCreate.showExpanded": {
                    listener: "{that}.setExpanded",
                    args: "{that}.model.isShowing"
                },
                "onPanelHide.showIcon": "{that}.showExplorationIcon",
                "onPanelHide.showLabel": {
                    listener: "{that}.setLabel",
                    args: "{that}.options.strings.showLabel"
                },
                "onPanelHide.showExpanded": {
                    listener: "{that}.setExpanded",
                    args: "false"
                },
                "onPanelShow.showIcon": "{that}.hideExplorationIcon",
                "onPanelShow.showLabel": {
                    listener: "{that}.setLabel",
                    args: "{that}.options.strings.hideLabel"
                },
                "onPanelShow.showExpanded": {
                    listener: "{that}.setExpanded",
                    args: "true"
                }
            }
        },
        invokers: {
            hideToolPanel: "{slidingPanel}.hidePanel",
            hideToolPanelInIframe: {
                funcName: "gpii.explorationTool.hideToolPanelInIframe",
                args: ["{that}.hideToolPanel", "{slidingPanel}.dom.toggleButton"]
            }
        },
        listeners: {
            afterRender: {
                listener: "gpii.explorationTool.initHideFuncs",
                args: "{that}",
                priority: "last"
            }
        },
        distributeOptions: {
            source: "{that}.options.iframeHtml",
            removeSource: true,
            target: "{that > iframeRenderer}.options.markupProps.src"
        }
    });

    // Pressing escape inside the exploration tool does:
    // 1. Hide the tool panel;
    // 2. Move focus to "show/hide" button
    gpii.explorationTool.hideToolPanelInIframe = function (genericHideFunc, elementToFocus) {
        genericHideFunc();
        elementToFocus.focus();
    };

    gpii.explorationTool.bindHideKey = function (key, element, hideFunc) {
        if (!element) {
            return;
        }

        var keybindingOpts = {
            additionalBindings: [{
                key: key,
                activateHandler: function (event) {
                    hideFunc();
                    event.preventDefault();
                }
            }]
        };

        fluid.activatable(element, null, keybindingOpts);
    };

    // Hide the exploration tool when clicking outside of the exploration tool panel or pressing escape
    gpii.explorationTool.initHideFuncs = function (that) {
        var html = $("html");

        html.click(function () {
            that.hideToolPanel();
        });

        that.container.click(function (event) {
            event.stopPropagation();
        });

        var iframeHtml = that.iframeRenderer.iframe.contents().find("html");

        // Bind hide function onto the main page and the iframe for exploration tool
        gpii.explorationTool.bindHideKey(that.options.keyBinding.hideTool, html, that.hideToolPanel);
        gpii.explorationTool.bindHideKey(that.options.keyBinding.hideTool, iframeHtml, that.hideToolPanelInIframe);
    };

    // Currently this code is duplicated from SlidingPanel.js
    // FLUID-5119 filed to move it to the framework, after which this should be removed in favour of the
    // generalized code.
    gpii.explorationTool.lookupMsg = function (messageResolver, value) {
        var looked = messageResolver.lookup([value]);
        return looked ? looked.template : looked;
    };

    /*************
     * The base grade component for each individual panel
     *************/
    fluid.defaults("gpii.explorationTool.defaultPanel", {
        gradeNames: ["fluid.uiOptions.defaultPanel", "autoInit"],
        sourceApplier: "{modelTransformer}.applier"
    });

    /*************
     * A component that transforms the panels' boolean models into UIO model values
     * and relays the changes
     *************/
    fluid.defaults("gpii.explorationTool.modelTransformer", {
        gradeNames: ["fluid.modelComponent", "fluid.uiOptions.modelRelay", "autoInit"],
        model: {
            panelSelections: {
                highContrast: false,
                lowContrast: false,
                increaseSize: false,
                simplify: false,
                moreText: false,
                spoken: false
            },
            convertedModel: {
                textFont: "default",
                theme: "default",
                textSize: 1,
                lineSpace: 1,
                toc: false,
                links: false,
                inputsLarger: false,
                simplifyContent: false,
                showMoreText: false,
                selfVoicing: false
            }
        },
        mapping: {
            highContrast: {
                theme: "bw",
                links: true,
                inputsLarger: true,
                textFont: "arial"
            },
            lowContrast: {
                theme: "lgdg",
                links: true,
                inputsLarger: true,
                textFont: "arial"
            },
            increaseSize: {
                textSize: 1.5,
                lineSpace: 1.3
            },
            simplify: {
                textSize: 1.2,
                lineSpace: 1.2,
                toc: true,
                simplifyContent: true
            },
            moreText: {
                showMoreText: true
            },
            spoken: {
                selfVoicing: true
            }
        },
        invokers: {
            convertModel: "gpii.explorationTool.modelTransformer.convertModel",
            relayConvertedModel: {
                funcName: "gpii.explorationTool.modelTransformer.relayConvertedModel",
                args: ["{that}", "{arguments}.0"]
            }
        },
        listeners: {
            "{uiOptions}.events.onReady": {
                listener: "{that}.applier.modelChanged.addListener",
                args: ["panelSelections", "{that}.relayConvertedModel"]
            }
        },
        components: {
            highContrast: {
                type: "gpii.explorationTool.panels.highContrast",
                container: "{uiOptions}.dom.highContrast",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                priority: "first",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: { // "externalModelKey": "internalModelKey"
                        "panelSelections.highContrast": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.highContrast"
                    }
                }
            },
            lowContrast: {
                type: "gpii.explorationTool.panels.lowContrast",
                container: "{uiOptions}.dom.lowContrast",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: {
                        "panelSelections.lowContrast": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.lowContrast"
                    },
                    listeners: {
                        // All of the listeners for toggling the contrasts are inside of
                        // lowContrast because the highContrast component has to be created
                        // before the IoC reference will resolve correctly.
                        "{highContrast}.events.afterEnabled": [{
                            listener: "{that}.applier.requestChange",
                            args: ["enabled", false],
                            namespace: "disableLowContrast"
                        }, {
                            listener: "{that}.refreshView",
                            namespace: "refreshLowContrast"
                        }],
                        "afterEnabled.disableHighContrast": {
                            listener: "{highContrast}.applier.requestChange",
                            args: ["enabled", false]
                        },
                        "afterEnabled.refreshHighContrast": {
                            listener: "{highContrast}.refreshView",
                            priority: "last"
                        }
                    }
                }
            },
            increaseSize: {
                type: "gpii.explorationTool.panels.increaseSize",
                container: "{uiOptions}.dom.increaseSize",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: {
                        "panelSelections.increaseSize": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.increaseSize"
                    }
                }
            },
            simplify: {
                type: "gpii.explorationTool.panels.simplify",
                container: "{uiOptions}.dom.simplify",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: {
                        "panelSelections.simplify": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.simplify"
                    }
                }
            },
            moreText: {
                type: "gpii.explorationTool.panels.moreText",
                container: "{uiOptions}.dom.moreText",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: {
                        "panelSelections.moreText": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.moreText"
                    }
                }
            },
            spoken: {
                type: "gpii.explorationTool.panels.spoken",
                container: "{uiOptions}.dom.spoken",
                createOnEvent: "{uiOptions}.events.onUIOptionsMarkupReady",
                options: {
                    gradeNames: "gpii.explorationTool.defaultPanel",
                    rules: {
                        "panelSelections.spoken": "enabled"
                    },
                    resources: {
                        template: "{templateLoader}.resources.spoken"
                    }
                }
            }
        }
    });

    gpii.explorationTool.modelTransformer.relayConvertedModel = function (that, newModel) {
        var convertedModel = that.convertModel(that, newModel.panelSelections);
        that.applier.requestChange("convertedModel", convertedModel);
    };

    gpii.explorationTool.modelTransformer.convertModel = function (that, sourceModel) {
        var result = fluid.copy(that.options.rootModel);

        var mergedMapping = {};
        fluid.each(that.options.rootModel, function (rootValue, rootKey) {
            fluid.each(sourceModel, function (modelValue, modelKey) {
                gpii.explorationTool.modelTransformer.transformModel(modelValue, modelKey, rootKey, that.options.mapping, mergedMapping);
            });
        });
        $.extend(result, mergedMapping);
        return result;
    };
    gpii.explorationTool.modelTransformer.transformModel = function (modelValue, modelKey, rootKey, mapping, mergedMapping) {
        if (modelValue) {
            var previousValue = mergedMapping[rootKey];
            var newValue = mapping[modelKey][rootKey];
            if (!previousValue || previousValue < newValue || newValue === true) {
                mergedMapping[rootKey] = newValue;
            }
        }
    };

    /***********
     * The set of all panels
     **********/
    fluid.defaults("gpii.explorationTool.panels", {
        gradeNames: ["fluid.uiOptions", "autoInit"],
        selectors: {
            trySomethingNew: ".flc-explorationTool-try",
            highContrast: ".flc-explorationTool-highContrast",
            lowContrast: ".flc-explorationTool-lowContrast",
            increaseSize: ".flc-explorationTool-increaseSize",
            simplify: ".flc-explorationTool-simplify",
            moreText: ".flc-explorationTool-moreText",
            spoken: ".flc-explorationTool-spoken"
        },
        components: {
            trySomethingNew: {
                type: "gpii.explorationTool.trySomethingNew",
                container: "{that}.dom.trySomethingNew",
                createOnEvent: "onReady",
                options: {
                    strings: {
                        label: {
                            expander: {
                                func: "gpii.explorationTool.lookupMsg",
                                args: ["{uiOptionsLoader}.msgBundle", "trySomethingNewText"]
                            }
                        }
                    },
                    presetPanels: {
                        expander: {
                            func: "gpii.explorationTool.panels.getSubcomponents",
                            args: ["{uiOptions}.modelTransformer"]
                        }
                    }

                }
            },
            modelTransformer: {
                type: "gpii.explorationTool.modelTransformer",
                options: {
                    sourceApplier: "{panels}.applier",
                    rootModel: "{panels}.rootModel",
                    rules: {  // "externalModelKey": "internalModelKey"
                        "highContrast": "panelSelections.highContrast",
                        "lowContrast": "panelSelections.lowContrast",
                        "increaseSize": "panelSelections.increaseSize",
                        "simplify": "panelSelections.simplify",
                        "moreText": "panelSelections.moreText",
                        "spoken": "panelSelections.spoken",

                        "textFont": "convertedModel.textFont",
                        "theme": "convertedModel.theme",
                        "textSize": "convertedModel.textSize",
                        "lineSpace": "convertedModel.lineSpace",
                        "toc": "convertedModel.toc",
                        "links": "convertedModel.links",
                        "inputsLarger": "convertedModel.inputsLarger",
                        "simplifyContent": "convertedModel.simplifyContent",
                        "showMoreText": "convertedModel.showMoreText",
                        "selfVoicing": "convertedModel.selfVoicing"
                    }
                }
            }
        }
    });

    // Will only add those subcompoents that have the grade "gpii.explorationTool.defaultPanel"
    gpii.explorationTool.panels.getSubcomponents = function (component) {
        var subComponents = [];
        fluid.each(component.options.components, function (opts, memberName) {
            var subComponent = fluid.get(component, memberName);
            if (fluid.hasGrade(subComponent.options, "gpii.explorationTool.defaultPanel")) {
                subComponents.push(subComponent);
            }
        });
        return subComponents;
    };

    fluid.defaults("gpii.explorationTool.togglePanel", {
        gradeNames: ["fluid.uiOptions.panels", "autoInit"],
        finalInitFunction: "gpii.explorationTool.togglePanel.finalInit",
        selectors: {
            toggle: ".flc-explorationTool.togglePanel.toggle",
            label: ".flc-explorationTool.togglePanel.label-text"
        },
        events: {
            afterDisabled: null,
            afterEnabled: null
        },
        model: {
            enabled: false
        },
        protoTree: {
            toggle: "${enabled}",
            label: ""
        }
    });

    gpii.explorationTool.togglePanel.finalInit = function (that) {
        that.applier.modelChanged.addListener("enabled", function (newModel, oldModel) {
            if (newModel.enabled !== oldModel.enabled) {
                that.events[newModel.enabled ? "afterEnabled" : "afterDisabled"].fire(that);
            }
        });
    };

    /************************
     * High Contrast:
     *
     * The Exploration Tool 'high contrast' option will set:
     * - black on white
     * - emphasize links
     * - inputs larger
     * - sans serif font or monospaced font
     *********************/
    fluid.defaults("gpii.explorationTool.panels.highContrast", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        selectors: {
            toggle: ".flc-explorationTool-highContrast-choice",
            label: ".flc-explorationTool-highContrast-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "highContrastLabel"}
        }
        
    });

    /************************
     * Low Contrast:
     *
     * The Exploration Tool 'low contrast' option will set:
     * - light grey on dark grey
     * - emphasize links
     * - inputs larger
     * - sans serif font or monospaced font
     *********************/
    fluid.defaults("gpii.explorationTool.panels.lowContrast", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        selectors: {
            toggle: ".flc-explorationTool-lowContrast-choice",
            label: ".flc-explorationTool-lowContrast-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "lowContrastLabel"}
        }
    });

    /************************
     * Increase Size
     *********************/
    fluid.defaults("gpii.explorationTool.panels.increaseSize", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        // this is being ignored - ??
        selectors: {
            toggle: ".flc-explorationTool-increaseSize-choice",
            label: ".flc-explorationTool-increaseSize-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "increaseSizeLabel"}
        }
    });

    /************************
     * Simplify
     *********************/
    fluid.defaults("gpii.explorationTool.panels.simplify", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        // this is being ignored - ??
        selectors: {
            toggle: ".flc-explorationTool-simplify-choice",
            label: ".flc-explorationTool-simplify-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "simplifyLabel"}
        }  
    });

    /**********************************************************************************
     * simplifiedContentEnactor
     *
     * Simplify content based upon the model value.
     **********************************************************************************/

    // Note that the implementors need to provide the container for this view component
    fluid.defaults("gpii.explorationTool.enactors.simplifiedContent", {
        gradeNames: ["fluid.viewComponent", "fluid.uiOptions.enactors", "autoInit"],
        selectors: {
            elementsToHide: "header, footer, aside, nav, .flc-uiOptions-simplify-hide"
        },
        styles: {
            simplified: "fl-simplify"
        },
        model: {
            value: false
        },
        events: {
            settingChanged: null,
            onApplySimplify: null,
            onRemoveSimplify: null
        },
        invokers: {
            set: {
                funcName: "gpii.explorationTool.enactors.simplifiedContent.set",
                args: ["{that}.model.value", "{that}"]
            }
        },
        listeners: {
            onCreate: "{that}.set",
            "onApplySimplify.applyCss": {
                "this": "{that}.container",
                method: "addClass",
                args: "{that}.options.styles.simplified"
            },
            "onApplySimplify.hideElements": {
                "this": "{that}.dom.elementsToHide",
                method: "hide"
            },
            "onRemoveSimplify.removeCss": {
                "this": "{that}.container",
                method: "removeClass",
                args: "{that}.options.styles.simplified"
            },
            "onRemoveSimplify.showElements": {
                "this": "{that}.dom.elementsToHide",
                method: "show"
            }
        }
    });

    gpii.explorationTool.enactors.simplifiedContent.set = function (value, that) {
        if (value) {
            that.events.onApplySimplify.fire();
        } else {
            that.events.onRemoveSimplify.fire();
        }
    };

    gpii.explorationTool.enactors.simplifiedContent.finalInit = function (that) {
        that.applier.modelChanged.addListener("value", function (newModel) {
            that.set();
        });
    };

    /***********************
     * More Text
     ***********************/
    fluid.defaults("gpii.explorationTool.panels.moreText", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        // this is being ignored - ??
        selectors: {
            toggle: ".flc-explorationTool-moreText-choice",
            label: ".flc-explorationTool-moreText-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "moreTextLabel"}
        }  
    });

    /**********************************************************************************
     * showMoreText enactor
     **********************************************************************************/

    // Note that the implementors need to provide the container for this view component
    fluid.defaults("gpii.explorationTool.enactors.showMoreText", {
        gradeNames: ["fluid.viewComponent", "fluid.uiOptions.enactors", "autoInit"],
        selectors: {
            moreTexts: ".flc-explorationTool-moreText-container",
            images: "img, [role~='img']",
            textEl: "details" // selector of element in 'markup.moreText' where text should be inserted
        },
        styles: {
            hidden: "fl-hidden"
        },
        model: {
            value: false
        },
        events: {
            settingChanged: null
        },
        listeners: {
            onCreate: {
                listener: "{that}.set",
                args: ["{that}.model.value"]
            }
        },
        invokers: {
            addMoreTextMarkup: {
                funcName: "gpii.explorationTool.enactors.showMoreText.addMoreTextMarkup",
                args: ["{that}.dom.images", "{that}.getMoreText", "{that}.buildMoreTextMarkup"]
            },
            getMoreText: "gpii.explorationTool.enactors.showMoreText.getAltText",
            buildMoreTextMarkup: {
                funcName: "gpii.explorationTool.enactors.showMoreText.buildMoreTextMarkup",
                args: ["{that}.options.markup.moreText", "{that}.options.selectors.textEl", "{arguments}.0"]
            },
            set: {
                funcName: "gpii.explorationTool.enactors.showMoreText.set",
                args: ["{arguments}.0", "{that}"]
            }
        },
        members: {
            moreTextMarkupAdded: false
        },
        markup: {
            moreText: "<div class='flc-explorationTool-moreText-container fl-explorationTool-moreText fl-fix'><details><summary></summary></details></div>"
        }
    });

    gpii.explorationTool.enactors.showMoreText.addMoreTextMarkup = function (imgs, getMoreTextFunc, buildMoreTextMarkupFunc) {
        fluid.each(imgs, function (img) {
            img = $(img);
            var text = getMoreTextFunc(img);
            if (text) {
                img.after(buildMoreTextMarkupFunc(text));
            }
        });
    };

    gpii.explorationTool.enactors.showMoreText.getAltText = function (img) {
        return img.attr("alt") || img.attr("aria-label");
    };

    gpii.explorationTool.enactors.showMoreText.buildMoreTextMarkup = function (markup, textElSelector, text) {
        var container = $(markup);
        var textEl = $(textElSelector, container);
        if (textEl.length < 1) { // in case the textEl _is_ the container
            container.append(text);
        } else {
            textEl.append(text);
        }
        return container;
    };

    gpii.explorationTool.enactors.showMoreText.finalInit = function (that) {
        that.applier.modelChanged.addListener("value", function (newModel, oldModel) {
            if (newModel.value !== oldModel.value) {
                that.set(newModel.value);
            }
        });
    };
    gpii.explorationTool.enactors.showMoreText.set = function (value, that) {
        if (!that.moreTextMarkupAdded) {
            that.addMoreTextMarkup();
            that.moreTextMarkupAdded = true;
        }
        that.dom.fastLocate("moreTexts").toggleClass(that.options.styles.hidden, !value);
    };

    /************************
     * Spoken
     *********************/
    fluid.defaults("gpii.explorationTool.panels.spoken", {
        gradeNames: ["gpii.explorationTool.togglePanel", "autoInit"],
        // this is being ignored - ??
        selectors: {
            toggle: ".flc-explorationTool-spoken-choice",
            label: ".flc-explorationTool-spoken-string"
        },
        protoTree: {
            toggle: "${enabled}",
            label: {messagekey: "spokenLabel"}
        }
    });

    /*************************
     * Set of all enactors
     **************************/
    fluid.defaults("gpii.explorationTool.enactorSet", {
        gradeNames: ["fluid.uiEnhancer.starterEnactors", "autoInit"],
        components: {
            tableOfContents: {
                options: {
                    components: {
                        tableOfContents: {
                            options: {
                                selectors: {
                                    // Only look for headings thare within the simplified text, since the ToC is only rendered on simplify.
                                    headings: ":header:visible:not(.flc-toc-tocContainer :header, header :header, footer :header, aside :header, nav :header, .flc-uiOptions-simplify-hide :header)"
                                }
                            }
                        }
                    }
                }
            },
            simplify: {
                type: "gpii.explorationTool.enactors.simplifiedContent",
                container: "{uiEnhancer}.container",
                options: {
                    sourceApplier: "{uiEnhancer}.applier",
                    rules: {
                        "simplifyContent": "value"
                    },
                    model: {
                        value: "{fluid.uiOptions.rootModel}.rootModel.simplifyContent"
                    }
                }
            },
            moreText: {
                type: "gpii.explorationTool.enactors.showMoreText",
                container: "{uiEnhancer}.container",
                options: {
                    sourceApplier: "{uiEnhancer}.applier",
                    rules: {
                        "showMoreText": "value"
                    },
                    model: {
                        value: "{fluid.uiOptions.rootModel}.rootModel.showMoreText"
                    }
                }
            },
            selfVoicing: {
                type: "gpii.explorationTool.enactors.selfVoicing",
                container: "{uiEnhancer}.container",
                options: {
                    sourceApplier: "{uiEnhancer}.applier",
                    rules: {
                        "selfVoicing": "value"
                    },
                    model: {
                        value: "{fluid.uiOptions.rootModel}.rootModel.selfVoicing"
                    }
                }
            }
        },
        distributeOptions: {
            source: "{that}.options.moreTextSelector",
            removeSource: true,
            target: "{that > moreText}.options.selectors.images"
        }
    });

    // Removes the selfVoicing enactor from the fatPanel iFrame
    fluid.demands("gpii.explorationTool.enactors.selfVoicing", ["fluid.uiOptions.fatPanel.renderIframe"], {
        funcName: "fluid.emptySubcomponent"
    });

    // Removes the selfVoicing enactor and the spoken panel from when HTML5Audio is not supported
    fluid.demands("gpii.explorationTool.enactors.selfVoicing", ["fluid.HTML5Audio.NotSupported"], {
        funcName: "fluid.emptySubcomponent"
    });
    fluid.demands("gpii.explorationTool.panels.spoken", ["fluid.HTML5Audio.NotSupported"], {
        funcName: "fluid.emptySubcomponent"
    });

    /**************************************
     * gpii.explorationTool.trySomethingNew *
     ***************************************/

    fluid.defaults("gpii.explorationTool.trySomethingNew", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            label: ".flc-explorationTool-tryLabel"
        },
        strings: {
            label: "Try Something New"
        },
        styles: {
            hover: "fl-explorationTool-hover"
        },
        events: {
            onHover: null,
            afterHover: null,
            onFocus: null,
            onBlur: null,
            afterActivate: null
        },
        presetPanels: [],
        numSelections: 2,
        listeners: {
            "onCreate.setLabel": {
                "this": "{that}.dom.label",
                "method": "html",
                "args": ["{that}.options.strings.label"]
            },
            "onCreate.click": {
                "this": "{that}.container",
                "method": "click",
                "args": ["{that}.events.afterActivate.fire"]
            },
            "onCreate.mouseenter": {
                "this": "{that}.container",
                "method": "mouseenter",
                "args": ["{that}.events.onHover.fire"]
            },
            "onCreate.mouseleave": {
                "this": "{that}.container",
                "method": "mouseleave",
                "args": ["{that}.events.afterHover.fire"]
            },
            "onCreate.focus": {
                "this": "{that}.container",
                "method": "focus",
                "args": ["{that}.events.onFocus.fire"]
            },
            "onCreate.blur": {
                "this": "{that}.container",
                "method": "blur",
                "args": ["{that}.events.onBlur.fire"]
            },
            "afterActivate.preventDefault": {
                listener: "gpii.explorationTool.trySomethingNew.preventDefault"
            },
            "afterActivate.activate": {
                listener: "{that}.randomizeSelection"
            },
            "onFocus.startCycle": {
                listener: "{that}.cycle.start"
            },
            "onBlur.stopCycle": {
                listener: "{that}.cycle.stop"
            },
            "onHover.startCycle": {
                listener: "{that}.cycle.start"
            },
            "afterHover.stopCycle": {
                listener: "{that}.cycle.stop"
            }
        },
        invokers: {
            randomizeSelection: {
                funcName: "gpii.explorationTool.trySomethingNew.randomizeSelection",
                args: ["{that}.options.presetPanels", "{that}.options.numSelections"]
            }
        },
        components: {
            cycle: {
                type: "gpii.explorationTool.cycle",
                options: {
                    items: "{trySomethingNew}.options.presetPanels",
                    listeners: {
                        "on.toggleClass": {
                            funcName: "gpii.explorationTool.trySomethingNew.toggleClass",
                            args: ["{arguments}.0.container", "{trySomethingNew}.options.styles.hover"]
                        },
                        "off.toggleClass": {
                            funcName: "gpii.explorationTool.trySomethingNew.toggleClass",
                            args: ["{arguments}.0.container", "{trySomethingNew}.options.styles.hover"]
                        }
                    }
                }
            }
        }
    });

    gpii.explorationTool.trySomethingNew.preventDefault = function (event) {
        event.preventDefault();
    };

    gpii.explorationTool.trySomethingNew.randomizeSelection = function (presetPanels, numSelections) {
        var components = fluid.copy(presetPanels);
        var toSelect = [];
        numSelections = Math.min(numSelections, components.length);

        for (var i = 0; i < numSelections; i++) {
            var randIndex = Math.floor(Math.random() * (components.length));
            toSelect = toSelect.concat(components.splice(randIndex, 1));
        }

        fluid.each(components, function (that) {
            that.applier.requestChange("enabled", false);
            that.refreshView();
        });
        fluid.each(toSelect, function (that) {
            that.applier.requestChange("enabled", true);
            that.refreshView();
        });
    };

    gpii.explorationTool.trySomethingNew.toggleClass = function (elm, className) {
        $(elm).toggleClass(className);
    };

    /*
     * Cycles through an array of items, one at a time based on the specified speed.
     * The items can be anything. When the cycle is started, each item will gain "focus"
     * one after another. As an item gains focus it fires the "on" event. Before the next
     * item is focused the current one will fire the "off" event. No two items will be
     * focused at the same time. The cycle will wrap around the array and continue until
     * stopped.
     */
    fluid.defaults("gpii.explorationTool.cycle", {
        gradeNames: ["fluid.modelComponent", "fluid.eventedComponent", "autoInit"],
        speed: "500",
        items: [],
        events: {
            on: null,
            off: null
        },
        model: {
            enabled: false,
            inStep: false
        },
        listeners: {
            "onCreate.cycle": {
                listener: "{that}.step"
            },
            "onCreate.modelChangedListenerEnabled": {
                listener: "{that}.applier.modelChanged.addListener",
                args: ["enabled", "{that}.step"]
            },
            "on.setModel": {
                listener: "{that}.applier.requestChange",
                args: ["inStep", true]
            },
            "off.setModel": {
                listener: "{that}.applier.requestChange",
                args: ["inStep", false]
            }
        },
        invokers: {
            start: {
                func: "{that}.applier.requestChange",
                args: ["enabled", true]
            },
            stop: {
                func: "{that}.applier.requestChange",
                args: ["enabled", false]
            },
            step: {
                funcName: "gpii.explorationTool.cycle.step",
                args: ["{that}.options.items", 0, "{that}.options.speed", "{that}.model", "{that}.events.on.fire", "{that}.events.off.fire"]
            }
        }
    });

    gpii.explorationTool.cycle.step = function (items, index, speed, model, callbackOn, callbackOff) {
        var numItems = items.length;
        if (model.enabled && !model.inStep && numItems) {
            var boundIndex = index % numItems;
            callbackOn(items[boundIndex], boundIndex);
            setTimeout(function () {
                callbackOff(items[boundIndex], boundIndex);
                gpii.explorationTool.cycle.step(items, ++index, speed, model, callbackOn, callbackOff);
            }, speed);
        }
    };

})(jQuery, fluid);
