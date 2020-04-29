(function (factory) {
  define("part/text-edit", [
    "speedy/editor",
    "speedy/monitor-bar",
    "knockout",
    "jquery",
    "speedy/arabic-shaping",
    "bootstrap",
  ], factory);
})(function (Speedy, MonitorBar, ko, $, ArabicShaping) {
  var Model = (function () {
    function Model(cons) {
      var _this = this;
      this.constructorData = cons;
      this.file = ko.observable("ReggF3-H19-316.json");
      this.files = ko.observableArray([
        { text: "Regesta Imperii", value: "ReggF3-H19-316.json" },
        {
          text: "Regesta Imperii without annotations",
          value: "ReggF3-H19-316-no-annotations.json",
        },
        { text: "Overlapping annotations on Liszt", value: "adam-liszt.json" },
        { text: "Hildegard von Bingen (#51)", value: "HildegardR51.json" },
        { text: "Hildegard von Bingen (#52)", value: "HildegardR52.json" },
        { text: "Hildegard von Bingen (#106)", value: "HildegardR106.json" },
        { text: "DTA-Basisformat XML -> SPEEDy", value: "dta2spo.json" },
        {
          text: "Michelangelo letter [ text alignment + image + video ]",
          value: "mich1.json",
        },
        { text: "Arabic script (RTL and ligature test)", value: "arabic.json" },
        {
          text: "Marllarmé: A Throw of the Dice [ animated ]",
          value: "mallarme.json",
        },
      ]);
      this.blacklist = ko.observable("div, body, text, p");
      this.currentModes = ko.observableArray([]);
      this.userGuid = "abcd-efgh-ijkl-mnop";
      this.viewer = ko.observable();
      this.editor = null; // Instantiated in setupEditor()
      this.checkbox = {
        expansions: ko.observable(true),
      };
      this.checkbox.expansions.subscribe(function () {
        return _this.showHideExpansions();
      });
    }
    Model.prototype.applyBindings = function (node) {
      ko.applyBindings(this, node);
      this.setupEditor();
    };
    Model.prototype.setupEditor = function (settings) {
      settings = settings || {};
      var cons = this.constructorData;
      var _this = this;
      this.container = settings.container
        ? settings.container
        : cons.template.querySelectorAll("[data-role='editor']")[0];
      this.monitor = settings.monitor
        ? settings.monitor
        : cons.template.querySelectorAll("[data-role='monitor']")[0];
      var configuration = {
        container: this.container,
        direction: settings.direction ? settings.direction : null,
        onPropertyCreated: function (prop, data) {
          // Copy the custom fields across from the JSON data to the Property.
          if (!data) {
            prop.userGuid = _this.userGuid;
            return;
          }
          prop.userGuid = data.userGuid;
          prop.deletedByUserGuid = data.deletedByUserGuid;
          prop.modifiedByUserGuid = data.modifiedByUserGuid;
        },
        onPropertyChanged: function (prop) {
          if (!_this.userGuid) {
            return;
          }
          prop.modifiedByUserGuid = _this.userGuid;
        },
        onPropertyDeleted: function (prop) {
          if (!_this.userGuid) {
            return;
          }
          prop.deletedByUserGuid = _this.userGuid;
        },
        onPropertyUnbound: function (data, prop) {
          // Copy the custom fields across from the Property to the JSON data.
          data.userGuid = prop.userGuid;
          data.deletedByUserGuid = prop.deletedByUserGuid;
          data.modifiedByUserGuid = prop.modifiedByUserGuid;
        },
        onMonitorUpdated: function (types) {
          _this.currentModes([]);
          var modes = types
            .filter(function (x) {
              return x.format == "decorate";
            })
            .map(function (x) {
              return x.type;
            });
          _this.currentModes(modes);
        },
        commentManager: function (prop) {
          // Handle the adding of a user comment to any standoff property.
          var value = prompt("Comment", prop.value || "");
          process(value);
        },
        onCharacterAdded: function (current, editor) {
          console.log(current, editor);
          // console.log({ current, editor });
          var getPrevious = (span) => span.previousElementSibling;
          var getNext = (span) => span.nextElementSibling;
          var previous = getPrevious(current);
          var next = getNext(current);
          var addZwj = ArabicShaping.addZwj;
          var isArabicChar = ArabicShaping.isArabicChar;
          if (false == isArabicChar(current.textContent)) {
            return;
          }
          if (previous) {
            var pchar = (getPrevious(previous) || {}).textContent;
            var nchar = (getNext(previous) || {}).textContent;
            previous.innerHTML = addZwj(previous.textContent, pchar, nchar);
          }
          if (current) {
            var pchar = (getPrevious(current) || {}).textContent;
            var nchar = (getNext(current) || {}).textContent;
            current.innerHTML = addZwj(current.textContent, pchar, nchar);
          }
          if (next) {
            var pchar = (getPrevious(next) || {}).textContent;
            var nchar = (getNext(next) || {}).textContent;
            next.innerHTML = addZwj(next.textContent, pchar, nchar);
          }
        },
        monitorOptions: {
          highlightProperties: true,
        },
        css: {
          highlight: "text-highlight",
        },
        monitorButton: {
          link:
            '<button data-toggle="tooltip" data-original-title="Edit" class="btn btn-sm"><span class="fa fa-link"></span></button>',
          layer:
            '<button data-toggle="tooltip" data-original-title="Layer" class="btn btn-sm"><span class="fa fa-cog"></span></button>',
          remove:
            '<button data-toggle="tooltip" data-original-title="Delete" class="btn btn-sm"><span class="fa fa-trash"></span></button>',
          comment:
            '<button data-toggle="tooltip" data-original-title="Comment" class="btn btn-sm"><span class="fa fa-comment"></span></button>',
          shiftLeft:
            '<button data-toggle="tooltip" data-original-title="Left" class="btn btn-sm"><span class="fa fa-arrow-circle-left"></span></button>',
          shiftRight:
            '<button data-toggle="tooltip" data-original-title="Right" class="btn btn-sm"><span class="fa fa-arrow-circle-right"></span></button>',
          expand:
            '<button data-toggle="tooltip" data-original-title="Expand" class="btn btn-sm"><span class="fa fa-plus-circle"></span></button>',
          contract:
            '<button data-toggle="tooltip" data-original-title="Contract" class="btn btn-sm"><span class="fa fa-minus-circle"></span></button>',
          toZeroPoint:
            '<button data-toggle="tooltip" data-original-title="Convert to zero point" class="btn btn-sm"><span style="font-weight: 600;">Z</span></button>',
          zeroPointLabel:
            '<button data-toggle="tooltip" data-original-title="Label" class="btn btn-sm"><span class="fa fa-file-text-o"></span></button>',
        },
        unbinding: {
          //maxTextLength: 20
        },
        propertyType: {
          tab: {
            format: "decorate",
            zeroPoint: {
              className: "tab",
            },
            labelRenderer: function () {
              return "tab";
            },
          },
          "alignment/indent": {
            format: "block",
            className: "block-indent",
            labelRenderer: function () {
              return "alignment (indent)";
            },
          },
          "alignment/justify": {
            format: "block",
            className: "block-justify",
            labelRenderer: function () {
              return "alignment (justify)";
            },
          },
          "alignment/right": {
            format: "block",
            className: "block-right",
            labelRenderer: function () {
              return "alignment (right)";
            },
          },
          "alignment/center": {
            format: "block",
            className: "block-center",
            labelRenderer: function () {
              return "alignment (center)";
            },
          },
          bold: {
            format: "decorate",
            shortcut: "b",
            className: "bold",
            labelRenderer: function () {
              return "<b>bold</b>";
            },
          },
          italics: {
            format: "decorate",
            shortcut: "i",
            className: "italic",
            labelRenderer: function () {
              return "<em>italics</em>";
            },
          },
          hyphen: {
            format: "decorate",
            zeroPoint: {
              className: "zwa-hyphen",
            },
            className: "zwa-hyphen",
            content: "-",
          },
          expansion: {
            format: "decorate",
            className: "expansion",
          },
          strike: {
            format: "decorate",
            className: "line-through",
          },
          underline: {
            format: "decorate",
            shortcut: "u",
            className: "underline",
          },
          superscript: {
            format: "decorate",
            className: "superscript",
          },
          subscript: {
            format: "decorate",
            className: "subscript",
          },
          space: {
            format: "decorate",
            className: "space",
          },
          line: {
            format: "decorate",
            className: "line",
          },
          domain: {
            format: "decorate",
            className: "domain",
            labelRenderer: function (prop) {
              return prop.guid
                ? "<span class='output-domain'>domain<span> (" + prop.text + ")"
                : "<span class='output-domain'>domain<span>";
            },
            propertyValueSelector: function (prop, process) {
              var note = prompt("Note:");
              process(note);
              prop.text = note;
              prop.schema.onRequestAnimationFrame(prop);
            },
            onRequestAnimationFrame: (p) => {
              // console.log({ p });
              if (!p.startNode || !p.endNode || p.isDeleted) {
                return;
              }
              var margin = p.node || document.createElement("SPAN");
              margin.speedy = {
                role: 3,
                stream: 1,
              };
              margin.innerHTML = null;
              margin.innerText = p.value;
              var line = document.createElement("SPAN");
              line.speedy = {
                role: 3,
                stream: 1,
              };
              margin.style.fontSize = "2rem";
              margin.style.position = "absolute";
              margin.style.transform = "rotate(-90deg)";
              margin.style.transformOrigin = "0 0";
              var w =
                p.endNode.offsetTop -
                p.startNode.offsetTop +
                p.endNode.offsetHeight;
              margin.title = p.text;
              margin.style.top =
                p.endNode.offsetTop + p.endNode.offsetHeight + "px"; // have to halve width as the region is rotated 90 degrees
              margin.style.left = "4px";
              margin.style.width = w + "px";
              line.style.position = "absolute";
              line.style.top = "33px";
              line.style.left = 0;
              line.style.opacity = 0.5;
              line.style.width = w + "px";
              line.style.backgroundColor = "purple";
              line.style.height = "4px";
              margin.appendChild(line);
              if (!p.nodeHooked) {
                p.editor.container.appendChild(margin);
                p.node = margin;
                p.nodeHooked = true;
              }
            },
          },
          page: {
            format: "decorate",
            className: "page",
            labelRenderer: function (prop) {
              return "page " + prop.value;
            },
            onRequestAnimationFrame: (p, type, editor) => {
              if (!p.startNode) {
                return;
              }
              var content = "p. " + (p.value || "?");
              // console.log({ content, startNode: p.startNode, endNode: p.endNode });
              var label = p.labelNode || document.createElement("SPAN");
              label.innerHTML = content;
              label.style.position = "absolute";
              var top = p.startNode.offsetTop;
              var bottom = p.endNode.offsetTop;
              var h = bottom - top + p.endNode.offsetHeight;
              label.style.top = top - 10 + "px";
              label.style.left = "40px";
              label.style.fontSize = "1rem";
              //label.style.height = h + "px";
              //label.style.opacity = 0.5;
              //label.style.width = "2px";
              //label.style.border = "2px solid purple";
              if (!p.labelNodeHooked) {
                label.speedy = { stream: 1 };
                editor.container.appendChild(label);
                p.labelNode = label;
                p.labelNodeHooked = true;
              }
            },
            propertyValueSelector: function (prop, process) {
              var num = prompt("Page number?", prop.value || "");
              process(num);
            },
          },
          paragraph: {
            format: "decorate",
            //className: "paragraph"
          },
          person: {
            format: "overlay",
            shortcut: "p",
            className: "person",
            labelRenderer: function (prop) {
              return prop.name ? "person (" + prop.name + ")" : "person";
            },
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Person UUID?", prop.value || "");
              process(uuid);
            },
          },
          event: {
            format: "overlay",
            className: "event",
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Event UUID?", prop.value || "");
              process(uuid);
            },
          },
          "codex/text": {
            format: "overlay",
            shortcut: "t",
            className: "text",
            zeroPoint: {
              className: "zero-text",
              offerConversion: function (prop) {
                return !prop.isZeroPoint;
              },
              selector: function (prop, process) {
                var label = prompt("Label", prop.text);
                process(label);
              },
            },
            attributes: {
              position: {
                renderer: function (prop) {
                  return (
                    "position [" +
                    (prop.attributes.position || "") +
                    "] <button data-toggle='tooltip' data-original-title='Set' class='btn btn-sm'><span class='fa fa-pencil'></span></button>"
                  );
                },
                selector: function (prop, process) {
                  var position = prompt("Position?", prop.attributes.position);
                  process(position);
                },
              },
            },
            labelRenderer: function (prop) {
              return prop.isZeroPoint
                ? "<span class='output-text'>footnote<span>"
                : "<span class='output-text'>text<span>";
            },
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Text UUID?", prop.value || "");
              process(uuid);
            },
          },
          place: {
            format: "overlay",
            className: "place",
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Place", prop.value || "");
              process(uuid);
            },
          },
          webLink: {
            format: "overlay",
            className: "web-link",
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Web Link", prop.value || "");
              process(uuid);
            },
          },
          date: {
            format: "overlay",
            className: "date",
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Date/Time", prop.value || "");
              process(uuid);
            },
          },
          concept: {
            format: "overlay",
            className: "concept",
            propertyValueSelector: function (prop, process) {
              var uuid = prompt("Concept UUID?", prop.value || "");
              process(uuid);
            },
          },
        },
      };
      this.editor = new Speedy(configuration);
      this.editor.bind({
        text: cons.editor.text || "",
        properties: cons.editor.properties || [],
      });
      var monitorBar = new MonitorBar({
        monitor: this.monitor,
        monitorOptions: {
          highlightProperties: true,
        },
        monitorButton: {
          link:
            '<button data-toggle="tooltip" data-original-title="Edit" class="btn btn-sm"><span class="fa fa-link"></span></button>',
          layer:
            '<button data-toggle="tooltip" data-original-title="Layer" class="btn btn-sm"><span class="fa fa-cog"></span></button>',
          remove:
            '<button data-toggle="tooltip" data-original-title="Delete" class="btn btn-sm"><span class="fa fa-trash"></span></button>',
          comment:
            '<button data-toggle="tooltip" data-original-title="Comment" class="btn btn-sm"><span class="fa fa-comment"></span></button>',
          redraw:
            '<button data-toggle="tooltip" data-original-title="Redraw" class="btn btn-sm"><span class="fa fa-pencil"></span></button>',
          shiftLeft:
            '<button data-toggle="tooltip" data-original-title="Left" class="btn btn-sm"><span class="fa fa-arrow-circle-left"></span></button>',
          shiftRight:
            '<button data-toggle="tooltip" data-original-title="Right" class="btn btn-sm"><span class="fa fa-arrow-circle-right"></span></button>',
          expand:
            '<button data-toggle="tooltip" data-original-title="Expand" class="btn btn-sm"><span class="fa fa-plus-circle"></span></button>',
          contract:
            '<button data-toggle="tooltip" data-original-title="Contract" class="btn btn-sm"><span class="fa fa-minus-circle"></span></button>',
          toZeroPoint:
            '<button data-toggle="tooltip" data-original-title="Convert to zero point" class="btn btn-sm"><span style="font-weight: 600;">Z</span></button>',
          zeroPointLabel:
            '<button data-toggle="tooltip" data-original-title="Label" class="btn btn-sm"><span class="fa fa-file-text-o"></span></button>',
        },
        propertyType: configuration.propertyType,
        commentManager: configuration.commentManager,
        css: {
          highlight: "text-highlight",
        },
        layerAdded: this.editor.layerAdded,
        updateCurrentRanges: this.editor.updateCurrentRanges,
      });
      this.editor.addMonitor(monitorBar);
      var animations = this.editor.data.properties.filter(
        (p) => !p.isDeleted && p.schema && p.schema.animation
      );
      if (animations.length) {
        animations.forEach((p) => {
          p.schema.animation.init(p, this.editor);
          p.schema.animation.start(p, this.editor);
        });
      }
    };
    Model.prototype.layerClicked = function (layer) {
      var selected = layer.selected();
      this.editor.setLayerVisibility(layer.name, selected);
      return true;
    };
    Model.counterClicked = function () {
      var p = this.editor.createZeroPointProperty("counter");
      var type = this.editor.propertyType.counter;
      type.animation.init(p);
      type.animation.start(p);
    };
    Model.prototype.isActiveMode = function (mode) {
      var modes = this.currentModes();
      return modes.indexOf(mode) >= 0;
    };
    Model.prototype.spaceClicked = function () {
      this.toggleAnnotation("space");
    };
    Model.prototype.pageClicked = function () {
      this.editor.createProperty("page");
    };
    Model.prototype.toggleAnnotation = function (type) {
      if (this.isActiveMode(type)) {
        this.editor.deleteAnnotation(type);
        this.currentModes.pop(type);
      } else {
        this.editor.createProperty(type);
      }
    };
    Model.prototype.hyphenClicked = function () {
      this.editor.createZeroPointProperty("hyphen");
    };
    Model.prototype.boldClicked = function () {
      this.toggleAnnotation("bold");
    };
    Model.prototype.italicsClicked = function () {
      this.toggleAnnotation("italics");
    };
    Model.prototype.strikeClicked = function () {
      this.toggleAnnotation("strike");
    };
    Model.prototype.superscriptClicked = function () {
      this.toggleAnnotation("superscript");
    };
    Model.prototype.expansionClicked = function () {
      this.toggleAnnotation("expansion");
    };
    Model.prototype.subscriptClicked = function () {
      this.toggleAnnotation("subscript");
    };
    Model.prototype.indentClicked = function () {
      this.editor.createBlockProperty("alignment/indent");
    };
    Model.prototype.justifyClicked = function () {
      this.editor.createBlockProperty("alignment/justify");
    };
    Model.prototype.rightClicked = function () {
      this.editor.createBlockProperty("alignment/right");
    };
    Model.prototype.centerClicked = function () {
      this.editor.createBlockProperty("alignment/center");
    };
    Model.prototype.underlineClicked = function () {
      this.toggleAnnotation("underline");
    };
    Model.prototype.lineClicked = function () {
      this.editor.createProperty("line");
    };
    Model.prototype.paragraphClicked = function () {
      this.editor.createProperty("paragraph");
    };
    Model.prototype.personClicked = function () {
      this.editor.createProperty("person");
    };
    Model.prototype.textClicked = function () {
      this.editor.createProperty("text");
    };
    Model.prototype.domainClicked = function () {
      this.editor.createProperty("domain");
    };
    Model.prototype.webLinkClicked = function () {
      this.editor.createProperty("webLink");
    };
    Model.prototype.eventClicked = function () {
      this.editor.createProperty("event");
    };
    Model.prototype.placeClicked = function () {
      this.editor.createProperty("place");
    };
    Model.prototype.dateClicked = function () {
      this.editor.createProperty("date");
    };
    Model.prototype.conceptClicked = function () {
      this.editor.createProperty("concept");
    };
    Model.prototype.unbindClicked = function () {
      var data = this.editor.unbind();
      this.viewer(JSON.stringify(data));
    };
    Model.prototype.loadClicked = function () {
      var _this = this;
      var file = this.file();
      $.get(file, function (json) {
        var blacklist = _this.blacklist();
        if (blacklist) {
          blacklist = blacklist.split(",").map((x) => x.trim());
          json.properties = json.properties.filter(
            (x) => blacklist.indexOf(x.type) == -1
          );
        }
        // var containsArabic = (file.indexOf("arabic") >= 0); // A crude temporary check. We will check for a meta-data property later.
        // if (containsArabic) {
        //     _this.setupEditor({
        //         container: _this.cloneNode(_this.container),
        //         // monitor: _this.cloneNode(_this.monitor),
        //         direction: "RTL",
        //         interpolateZeroWidthJoiningCharacter: true
        //     });
        // } else {
        //     _this.setupEditor({
        //         container: _this.cloneNode(_this.container),
        //         // monitor: _this.cloneNode(_this.monitor)
        //     });
        // }
        _this.setupEditor({
          container: _this.cloneNode(_this.container),
          // monitor: _this.cloneNode(_this.monitor)
        });
        _this.editor.bind(json);
        _this.viewer(null);
        _this.startAnimations(_this.editor);
      });
    };
    Model.prototype.cloneNode = function (node) {
      var clone = node.cloneNode(true);
      node.parentNode.replaceChild(clone, node);
      return clone;
    };
    Model.prototype.bindClicked = function () {
      var data = JSON.parse(this.viewer() || "{}");
      this.editor.bind({
        text: data.text,
        properties: data.properties,
      });
      this.startAnimations(this.editor);
    };
    return Model;
  })();

  return Model;
});
