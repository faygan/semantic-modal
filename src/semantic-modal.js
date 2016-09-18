
(function ($, root) {
    "use strict";

    var DEBUG = true;

    function initModal(options, elemId) {
        var $modal = $("<div class='ui small modal'>");
        $modal.attr("id", elemId);
        return $modal;
    };

    function initModalCloseIcon($modal, closable, closeIcon) {
        if (closable) {
            if (closeIcon === true) {
                $modal.append("<i class='close icon'></i>");
            }
        }
    };

    function initModalHeader($modal, options) {
        $modal.append($("<div class='header'></div>").text(options.title));
    };

    function initModalContent($modal) {
        $modal.append($("<div class='content'></div>"));
    };

    function setButtons(instanceId, $actionContext, buttonsArray) {
        if (!$actionContext)
            return;

        if (!Array.isArray(buttonsArray)) {
            if (buttonsArray === null) {
                // remove all buttons
                $actionContext.empty();
            }
            return;
        }

        // first, clear button items..
        $actionContext.empty();

        buttonsArray.forEach(function (button) {
            var $button = $("<div></div>")
                .text(button.title)
                .addClass("ui");

            if (button.actionTypes) {

                // set buttons base classes
                button.actionTypes.forEach(function (type) {
                    var bt = SemanticModal.buttonTypes[type];
                    if (bt) {
                        $button.addClass(bt);
                    }
                });
            };

            // additional css class for button 
            if (!$.isEmptyObject(button.cssClass)) {
                $button.addClass(button.cssClass);
            }

            $button.addClass("button");

            // set button class for icon
            if (button.iconClass !== undefined) {
                $button.append($("<i></i>").addClass(button.iconClass));
            }

            // set button click callback
            if ($.isFunction(button.action)) {
                $button.on("click", {
                    modalId: instanceId,
                    button: $button,
                    context: $actionContext
                }, button.action);
            }

            $actionContext.append($button);
        });
    };

    function setMessage($modalContent, message) {
        if ($modalContent) {
            $modalContent
                .empty()
                .append($("<p></p>").text(message));
        }
    };

    function initModalActions($modal, options, elemId) {
        if (options.buttonLess)
            return;

        var $actions = $("<div class='actions'></div>");

        // set action buttons
        setButtons(elemId, $actions, options.defaultButtons);

        $modal.append($actions);
    };

    function createModal(options, instanceId) {
        var $modal = initModal(options, instanceId);
        initModalCloseIcon($modal, options);
        initModalHeader($modal, options);
        initModalContent($modal);
        initModalActions($modal, options, instanceId);

        $modal.appendTo("body");
    };

    // http://stackoverflow.com/a/105074
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
          s4() + "-" + s4() + s4() + s4();
    };

    function getModalUniqeId(prefix) {
        var preval = new String("");

        if (!$.isEmptyObject(prefix)) {
            preval = prefix;
        }

        do {
            preval += guid().replace(/-/gi, "");
        }
        while (document.getElementById(preval));
        return preval;
    };

    function SemanticModal(fixedSettings) {
        var currentSettings = $.extend({}, this.defaultSettings, fixedSettings);

        var modalId = getModalUniqeId("modal-");

        // read-only properties
        Object.defineProperty(this, "instanceId", {
            get: function () {
                return modalId;
            }
        });

        Object.defineProperty(this, "thisSettings", {
            get: function () {
                return fixedSettings;
            }
        });

        // create modal base element
        createModal(currentSettings, this.instanceId);

        if (DEBUG === true) {
            console.info("New instance created for SemanticModal -> " + this.instanceId);
        }
    };

    SemanticModal.prototype = {
        constructor: SemanticModal,

        getModal: function () {
            return document.getElementById(this.instanceId);
        },

        getModalContent: function (modal) {
            return $(modal).find("div.content");
        },

        getModalHeader: function (modal) {
            return $(modal).find("div.header");
        },

        getModalAction: function (modal) {
            return $(modal).find("div.actions");
        },

        getModalButtons: function () {
            var modal = this.getModal();
            if (modal !== undefined) {
                var $context = this.getModalAction(modal);
                if ($context) {
                    return $context.find("div.ui.button");
                }
            }
            return [];
        },

        getSettings: function (settings) {
            return $.extend({},
                SemanticModal.prototype.defaultSettings,
                this.thisSettings,
                settings);
        },

        setHeader: function (text) {
            var modal = this.getModal();
            if (modal) {
                var $header = this.getModalHeader(modal);
                if ($header) {
                    $header.text(text);
                }
            }
            return this;
        },

        setActions: function (options) {
            var settings = $.extend({}, this.defaultSettings, options);
            var modal = this.getModal();
            if (modal) {
                if (settings.buttonLess) {
                    $(modal).find("div.actions").remove();
                } else {
                    var $context = this.getModalAction(modal);
                    if ($context.length <= 0) {
                        initModalActions($(modal), settings, this.instanceId);
                    }
                }
            }
            return this;
        },

        setButtons: function (buttons) {
            var modal = this.getModal();
            if (modal) {
                setButtons(this.instanceId, this.getModalAction(modal), buttons);
            }
            return this;
        },

        setClosable: function (closable, closeIcon) {
            var modal = this.getModal();
            if (modal) {
                if (true === closable) {
                    initModalCloseIcon($(modal), closable, closeIcon);
                } else {
                    $(modal).find("i").remove(".close.icon");
                }
            }

            return this;
        },

        show: function (message, settings) {
            var currentSettings = this.getSettings(settings);

            this.reset(currentSettings);

            var modal = this.getModal();
            if (modal) {
                setMessage(this.getModalContent(modal), message);
                if (!currentSettings.buttonLess) {
                    setButtons(this.instanceId, this.getModalAction(modal), settings.defaultButtons);
                }
                this.launch(modal, currentSettings);
            }
            return this;
        },

        // modal set to not closable
        showModal: function (message, settings) {
            settings = $.extend(settings, {
                closable: false,
                closeIcon: false
            });
            return this.show(message, settings);
        },

        confirm: function (message, settings) {
            var currentSettings = this.getSettings(settings);

            this.reset(currentSettings);

            var modal = this.getModal();
            if (modal) {
                setMessage(this.getModalContent(modal), message);
                if (!currentSettings.buttonLess) {
                    setButtons(this.instanceId, this.getModalAction(modal), settings.confirmButtons);
                }
                this.launch(modal, currentSettings);
            }
            return this;
        },

        // modal set to not closable
        confirmModal: function (message, settings) {
            settings = $.extend(settings, {
                closable: false,
                closeIcon: false
            });
            return this.confirm(message, settings);
        },

        reset: function (settings) {
            var currentSettings = this.getSettings(settings);
            this
                .setClosable(currentSettings.closable, currentSettings.closeIcon)
                .setHeader(currentSettings.title)
                .setActions(currentSettings)
                .setButtons(currentSettings.defaultButtons)
            ;

            return this;
        },

        launch: function (modal, settings) {
            var self = this;
            var launchSettings = this.getSettings(settings);
            return $(modal)
                .modal({
                    debug: DEBUG,

                    transition: launchSettings.transition,
                    inverted: launchSettings.inverted,
                    blurring: launchSettings.blurring,

                    closable: launchSettings.closable,

                    onDeny: function ($element) {
                        if ($.isFunction(launchSettings.reject)) {
                            return launchSettings.reject($element);
                        }
                        return true;
                    },
                    onApprove: function ($element) {
                        if ($.isFunction(launchSettings.accept)) {
                            return launchSettings.accept($element);
                        }
                        return true;
                    },
                    onHidden: function () {
                        if ($.isFunction(launchSettings.hide)) {
                            return launchSettings.hide();
                        }
                        return true;
                    },
                    onShow: function () {
                        if ($.isFunction(launchSettings.show)) {
                            launchSettings.show(self);
                        }
                    }
                })
                .modal("show");
        }
    };

    // semantic-ui action classes
    SemanticModal.buttonTypes = {
        "ok": "ok",
        "positive": "positive",
        "approve": "approve",
        "negative": "negative",
        "deny": "deny",
        "cancel": "cancel",
        "close": "close"
    };

    SemanticModal.transitionTypes = {
        "scale": "scale",
        "fade": "fade",
        "fadeup": "fade up",
        "fadedown": "fade down",
        "fadeleft": "fade left",
        "faderight": "fade right",
        "horizontalflip": "horizontal flip",
        "verticalflip": "vertical flip",
        "drop": "drop",
        "flyleft": "fly left",
        "flyright": "fly right",
        "flyup": "fly up",
        "flydown": "fly down",
        "swingleft": "swing left",
        "swingright": "swing right",
        "swingup": "swing up",
        "swingdown": "swing down",
        "browse": "browse",
        "browseright": "browse right",
        "slidedown": "slide down",
        "slideup": "slide up",
        "slideleft": "slide left",
        "slideright": "slide right",
        "jiggle": "jiggle",
        "flash": "flash",
        "shake": "shake",
        "pulse": "pulse",
        "tada": "tada",
        "bounce": "bounce"
    };

    SemanticModal.prototype.defaultSettings = {
        title: window.location.hostname,
        transition: SemanticModal.transitionTypes.scale,
        blurring: false,
        inverted: false,
        closeIcon: true,
        closable: true,
        buttonLess: false,
        defaultButtons: new Array(
            {
                actionTypes: [SemanticModal.buttonTypes.ok],
                cssClass: "",
                title: "Ok",
                iconClass: undefined,
                action: undefined
            }),
        confirmButtons: [
                    {
                        actionTypes: [SemanticModal.buttonTypes.positive],
                        cssClass: "", //"right labeled icon"
                        title: "Ok",
                        iconClass: "", //"checkmark icon"
                        action: undefined
                    },
                    {
                        actionTypes: [SemanticModal.buttonTypes.cancel],
                        cssClass: "",
                        title: "Cancel",
                        iconClass: undefined,
                        action: undefined
                    }
        ],
        // modal events delegates
        accept: undefined,
        reject: undefined,
        hide: undefined,
        show: undefined
    };

    root.SemanticModal = SemanticModal;

})(jQuery, window);
