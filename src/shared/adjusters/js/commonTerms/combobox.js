/*!
Cloud4all Preferences Management Tools

Copyright 2013 Astea
Copyright 2014 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/GPII/prefsEditors/LICENSE.txt
*/

(function ($) {
    "use strict";

    $.widget("custom.combobox", {
        options: {
            labelDomElement: null,
            title: null
        },

        _create: function (labelDomElement) {
            this.wrapper = $("<span>")
                .addClass("custom-combobox")
                .attr("role", "application")
                .insertAfter(this.element);

            /**
             The jQuery autocomplete widget has an accessibility issue that when using keyboard moving thru the items listed on
             the drop down list box, NVDA sometimes announces some items as "blank".
             The workaround for this issue is to add a live region that gets updated with the item content whenever the focus on
             the drop down list is changed. However, this results in a situation that the item content is either announced twice
             or announced as "blank" + the item content.
             A better solution is needed for this issue.
             **/
            this.liveRegionID = fluid.allocateGuid();
            this.wrapper.append("<span class=\"ui-helper-hidden-accessible\" aria-live=\"polite\" aria-atomic=\"true\" aria-relevant=\"all\" id=\"' + this.liveRegionID + '\"></span>");

            this.element.hide();
            this._createAutocomplete(labelDomElement);
            this._createShowAllButton();
        },

        _createAutocomplete: function () {
            var selected = this.element.children(":selected"),
                value = selected.val() ? selected.text() : "";

            // Get the label id to associate with the combobox
            var labelId = gpii.ariaUtility.getLabelId(this.options.labelDomElement);

            this.input = $("<input>")
                .appendTo(this.wrapper)
                .val(value)
                .attr("title", "")
                .attr("role", "combobox")
                .attr("aria-labelledby", labelId)
                .addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
                .autocomplete({
                    delay: 0,
                    minLength: 0,
                    source: $.proxy(this, "_source")
                })
                .focus(function () {
                    $(this).select();
                })
                .tooltip({
                    tooltipClass: "ui-state-highlight"
                });

            this._on(this.input, {
                autocompleteselect: function (event, ui) {
                    ui.item.option.selected = true;
                    this._trigger("select", event, {
                        item: ui.item.option
                    });
                    var ids = ["#gpii_primarySchema_universalLanguage_universalLanguage", "#gpii_primarySchema_screenReaderLanguage_screenReaderLanguage", "#gpii_primarySchema_textHighlighting_textHighlighting"];
                    fluid.each(ids, function (id) {
                        var newValue = $(id).val();
                        $(id).trigger("change", newValue);
                    });
                },
                autocompletechange: "_removeIfInvalid",
                autocompletefocus: function (event, ui) {
                    this.wrapper.find("#" + this.liveRegionID).html(ui.item.label);
                }
            });
        },

        _createShowAllButton: function () {
            var input = this.input,
                wasOpen = false,
                title = this.options.title;

            $("<a>")
                .attr("tabIndex", -1)
                .attr("title", "Show All " + title.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}))
                .tooltip()
                .appendTo(this.wrapper)
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .addClass("custom-combobox-toggle ui-corner-right")
                .mousedown(function () {
                    wasOpen = input.autocomplete("widget").is(":visible");
                })
                .focus(function () {
                    input.select();
                })
                .click(function () {
                    input.focus();
                    // Close if already visible
                    if (wasOpen) {
                        return;
                    }

                    // Pass empty string as value to search for, displaying all results
                    input.autocomplete("search", "");
                });
        },

        _source: function (request, response) {
            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
            response(this.element.children("option").map(function () {
                var text = $(this).text();
                if (this.value && (!request.term || matcher.test(text))) {
                    return {
                        label: text,
                        value: text,
                        option: this
                    };
                }
            }));
        },


        _removeIfInvalid: function (event, ui) {
            // Selected an item, nothing to do
            if (ui.item) {
                return;
            }

            // Search for a match (case-insensitive)
            var value = this.input.val(),
                valueLowerCase = value.toLowerCase(),
                valid = false;
            this.element.children("option").each(function () {
                if ($(this).text().toLowerCase() === valueLowerCase) {
                    this.selected = valid = true;
                    return false;
                }
            });

            // Found a match, nothing to do
            if (valid) {
                return;
            }

            // Remove invalid value
            this.input
                .val("")
                .attr("title", value + " didn't match any listed item")
                .tooltip("open");
            this.element.val("");
            this._delay(function () {
                this.input.tooltip("close").attr("title", "");
            }, 2500);
            this.input.data("ui-autocomplete").term = "";
        },

        _destroy: function () {
            this.wrapper.remove();
            this.element.show();
        }
    });
})(jQuery);

$(function () {
    "use strict";
    
    $.noConflict(); //switch namespace to version 1.9.1 of jQuery. Should be unnecessary after version update.
});
