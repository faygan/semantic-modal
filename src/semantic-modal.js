
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

    function setButtons(modalInstance, buttonsArray) {
        var modal = modalInstance.getModal();
        if (!modal)
            return;

        var $actionContext = modalInstance.getModalAction(modal);
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

            // check required for button creation
            if ($.isFunction(button.checkBefore)) {
                var validButton = button.checkBefore(button);
                if (validButton === false)
                    return;
            }

            var $button = $("<div></div>")
                .text(button.title)
                .addClass("small");

            var cssOnly = false;
            var cssClassArray = [];

            if (button.cssClass) {
                if (button.cssClass.startsWith("ui")) {
                    cssOnly = true;
                }

                cssClassArray = button.cssClass.split(" ");
            }

            // apply semantic-ui pre-defined button class (SemanticModal.buttonTypes)
            if (!cssOnly) {
                $button.addClass("ui");

                if (button.actionTypes) {
                    // set buttons base classes
                    button.actionTypes.forEach(function (type) {
                        var bt = SemanticModal.buttonTypes[type];
                        if (bt) {
                            $button.addClass(bt);
                        }
                    });
                };

                cssClassArray.forEach(function (item) {
                    $button.addClass(item);
                });

                $button.addClass("button");
            } else {
                // apply css class for this button 
                cssClassArray.forEach(function (classItem) {
                    $button.addClass(classItem);
                });
            }

            // set button class for icon
            if (button.iconClass !== undefined) {
                $button.append($("<i></i>").addClass(button.iconClass));
            }

            // set button element name
            if (button.name) {
                $button.attr("name", button.name);
            }

            // set button click callback
            if ($.isFunction(button.action)) {
                $button.on("click", {
                    modalInstance: modalInstance,
                    $button: $button
                }, button.action);
            }

            $actionContext.append($button);
        });
    };

    function initModalActions($modal, options, modalInstance) {
        if (options.buttonLess)
            return;

        var $actions = $("<div class='actions'></div>");
        $modal.append($actions);

        // set action buttons
        setButtons(modalInstance, options.defaultButtons);
    };

    function createModal(options, instance) {
        var $modal = initModal(options, instance.instanceId);
        initModalCloseIcon($modal, options);
        initModalHeader($modal, options);
        initModalContent($modal);
        initModalActions($modal, options, instance);

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
        createModal(currentSettings, this);

        if (DEBUG === true) {
            console.info("New instance created for SemanticModal -> " + this.instanceId);
        }
    };

    SemanticModal.prototype = {
        constructor: SemanticModal,

        getModal: function () {
            return document.getElementById(this.instanceId);
        },

        getModalContent: function () {
            return $(this.getModal()).find("div.content");
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
                        initModalActions($(modal), settings, this);
                    }
                }
            }
            return this;
        },

        setButtons: function (buttons) {
            setButtons(this, buttons);
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

        setMessage: function (message) {
            var $modalContent = this.getModalContent();
            if ($modalContent) {
                $modalContent
                    .empty()
                    .css("overflow", "auto")
                    .append($("<p></p>").html(message));
            }
        },

        show: function (message, settings) {
            var currentSettings = this.getSettings(settings);

            this.reset(currentSettings);

            var modal = this.getModal();
            if (modal) {
                this.setMessage(message);
                if (!currentSettings.buttonLess) {
                    setButtons(this, currentSettings.defaultButtons);
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
                this.setMessage(message);
                if (!currentSettings.buttonLess) {
                    setButtons(this, currentSettings.confirmButtons);
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

    // semanti-ui transition type enums
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

    // pre-defined button name constants
    SemanticModal.BUTTON_DEFAULT_OK = "DEFAULT_OK";
    SemanticModal.BUTTON_CONFIRM_OK = "CONFIRM_OK";
    SemanticModal.BUTTON_CONFIRM_CANCEL = "CONFIRM_CANCEL";

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
                name: SemanticModal.BUTTON_DEFAULT_OK,
                actionTypes: [SemanticModal.buttonTypes.ok],
                cssClass: "",
                title: "Ok",
                iconClass: undefined,
                action: undefined,
                checkBefore: undefined
            }),
        confirmButtons: [
                    {
                        name: SemanticModal.BUTTON_CONFIRM_OK,
                        actionTypes: [SemanticModal.buttonTypes.positive],
                        cssClass: "", // sample button class: "right labeled icon"
                        title: "Ok",
                        iconClass: "", // sample icon class: "checkmark icon"
                        action: undefined,
                        checkBefore: undefined
                    },
                    {
                        name: SemanticModal.BUTTON_CONFIRM_CANCEL,
                        cssClass: "ui basic red cancel button",
                        title: "Cancel",
                        iconClass: undefined,
                        action: undefined,
                        checkBefore: undefined
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
