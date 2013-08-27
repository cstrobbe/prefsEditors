var demo = demo || {};
(function ($, fluid) {

    demo.initWithSchema = function (container, compOpts, uioType) {
    	var uioBuilder = fluid.uiOptions.builder({
            primarySchema: fluid.uiOptions.pmt.primarySchema,
            auxiliarySchema: fluid.uiOptions.pmt.auxiliarySchema
        });
        var baseOpts = {
            components: {
                uiOptions: {
                    type: uioType
                }
            }
        };
        $.extend(true, baseOpts, compOpts);
        return fluid.invokeGlobalFunction(uioBuilder.options.assembledUIOGrade, [container, baseOpts]);
    };

    demo.initFullWithPreview = function (container, options) {
        return demo.initWithSchema(container, options, "fluid.uiOptions.fullPreview");
    };

    demo.initFullNoPreview = function (container, options) {
        return demo.initWithSchema(container, options, "fluid.uiOptions.fullNoPreview");
    };

    demo.initFinishedEvent = function(){
		//alert("aaa");
		$("#preferenceSwitch").change(function(){
			//alert("aaa");
			if(this.checked) {
		        $(".increaseSizePreferenceGroup").slideDown();
		    }
			else
			{
		        $(".increaseSizePreferenceGroup").slideUp();
			}
		});
	}
})(jQuery, fluid);