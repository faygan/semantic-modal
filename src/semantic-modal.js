
(function ($, root) {
    "use strict";

    var DEBUG = true;

    function initModal(options) {
        var $modal = $("<div class='ui modal'>");
        $modal.attr("id", options.instanceId);
        return $modal;
    };

    function initModalCloseIcon($modal) {
        $modal.append("<i class='close icon'></i>");
    };

    function initModalHeader($modal, options) {
        $modal.append($("<div class='header'></div>").text(options.title));
    };

    function initModalContent($modal) {
        $modal.append($("<div class='content'></div>"));
    };

    function setButtons(instanceId, $actionContext, buttonsArray) {
        if (!Array.isArray(buttonsArray)) {
            if (buttonsArray === null) {
                // remove all buttons
                $actionContext.empty();
            }
            return;
        }
        if (!$actionContext)
            return;

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
                    } else {
                        $button.addClass(type);
                    }
                });
            };

            $button.addClass("button");

            // set button class for icon
            if (button.icon !== undefined) {
                $button.append($("<i></i>").addClass(button.icon));
            }

            // set button click callback
            if ($.isFunction(button.action)) {
                $button.on("click", button.action.call({
                    modalId: instanceId,
                    button: $button,
                    context: $actionContext
                }));
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

    function initModalActions($modal, options) {
        var $actions = $("<div class='actions'></div>");

        // set action buttons
        setButtons(options.instanceId, $actions, options.defaultButtons);

        $modal.append($actions);
    };

    function createModal(options) {
        var $modal = initModal(options);
        if (options.closeIcon === true && options.closable) {
            initModalCloseIcon($modal);
        }
        initModalHeader($modal, options);
        initModalContent($modal);
        initModalActions($modal, options);

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

    function SemanticModal(settings) {
        var options = $.extend({}, this.defaultSettings, settings);

        if (!options.instanceId) {
            options.instanceId = getModalUniqeId("modal-");
        }

        this.CurrentSettings = options;
        var currentSettings = this.CurrentSettings;

        Object.defineProperty(this, "instanceId", {
            get: function () {
                if (currentSettings) {
                    return currentSettings.instanceId;
                }
                return undefined;
            },
            set: function (id) {
                currentSettings.instanceId = id;
            }
        });

        // create modal base element
        createModal(this.CurrentSettings);

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

        setTitle: function (title) {
            var modal = this.getModal();
            if (modal) {
                var $header = this.getModalHeader(modal);
                if ($header) {
                    $header.text(title);
                }
                return $(modal);
            }
            return undefined;
        },

        setButtons: function (buttons) {
            var modal = this.getModal();
            if (modal) {
                setButtons(this.instanceId, this.getModalAction(modal), buttons);
                return $(modal);
            }
            return undefined;
        },

        setClosable: function (value) {
            if (this.CurrentSettings) {
                this.CurrentSettings.closable = value;
            }

            // remove close icon
            var modal = this.getModal();

            if (modal) {
                if (value === true) {
                    initModalCloseIcon($(modal));
                } else {
                    $(modal).find("i").remove(".close.icon");
                }
            }
        },

        setTransition: function (value) {
            if (this.CurrentSettings) {
                this.CurrentSettings.transition = value;
            }
        },

        setCallbacks: function (accept, reject, hide, show) {
            if (this.CurrentSettings) {
                this.CurrentSettings.accept = accept;
                this.CurrentSettings.reject = reject;
                this.CurrentSettings.hide = hide;
                this.CurrentSettings.show = show;
            }
        },

        show: function (message) {
            var modal = this.getModal();
            if (modal) {
                setMessage(this.getModalContent(modal), message);
                setButtons(this.instanceId, this.getModalAction(modal), this.defaultSettings.defaultButtons);
                return this.launch(modal);
            }
            return undefined;
        },

        confirm: function (message) {
            var modal = this.getModal();
            if (modal) {
                setMessage(this.getModalContent(modal), message);
                setButtons(this.instanceId, this.getModalAction(modal), this.defaultSettings.confirmButtons);
                return this.launch(modal);
            }
            return undefined;
        },

        setModal: function (settings) {
            var modal = this.getModal();
            // todo:
            return $(modal);
        },

        launch: function (modal) {
            var self = this;
            return $(modal)
                .modal({
                    closable: self.CurrentSettings.closable,
                    inverted: self.CurrentSettings.inverted,
                    blurring: self.CurrentSettings.blurring,
                    transition: self.CurrentSettings.transition,
                    onDeny: function ($element) {
                        if ($.isFunction(self.CurrentSettings.reject)) {
                            self.CurrentSettings.reject($element);
                        }
                        return false;
                    },
                    onApprove: function ($element) {
                        if ($.isFunction(self.CurrentSettings.accept)) {
                            self.CurrentSettings.accept($element);
                        }
                    },
                    onHidden: function () {
                        if ($.isFunction(self.CurrentSettings.hide)) {
                            self.CurrentSettings.hide();
                        }
                    },
                    onShow: function () {
                        if ($.isFunction(self.CurrentSettings.show)) {
                            self.CurrentSettings.show();
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
        instanceId: undefined,
        title: window.location.hostname,
        closeIcon: true,
        closable: true,
        inverted: false,
        blurring: false,
        transition: SemanticModal.transitionTypes.scale,
        defaultButtons: new Array(
            {
                actionTypes: [SemanticModal.buttonTypes.ok],
                title: "Ok",
                icon: undefined,
                action: undefined
            }),
        confirmButtons: [
                    {
                        actionTypes: [SemanticModal.buttonTypes.positive, "right", "labeled", "icon"],
                        title: "Ok",
                        icon: "checkmark icon",
                        action: undefined
                    },
                    {
                        actionTypes: [SemanticModal.buttonTypes.negative, SemanticModal.buttonTypes.cancel],
                        title: "Cancel",
                        icon: undefined,
                        action: undefined
                    }
        ],
        accept: undefined,
        reject: undefined,
        hide: undefined,
        show: undefined
    };

    root.SemanticModal = SemanticModal;

})(jQuery, window);