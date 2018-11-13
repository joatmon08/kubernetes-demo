/**
 Copyright 2018 Rosemary Wang All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

Adapted from https://github.com/brendandburns/gcp-live-k8s-visualizer.
 */

const STROKECOLOR = 'rgb(255,149,0)';
const CONNECTORCOLORS = ["rgb(255,223,104)", "rgba(255,223,104,1.0)"];

var namespace = 'default';

var pods = [];
var services = [];
var uses = {};

var groups = {};

var truncate = function (name, id) {
    return name + '...' + id.substr(-5);
}

var insertByName = function (index, value) {
    if (!value || !value.metadata.labels || value.metadata.name == 'kubernetes') {
        return;
    }
    var list = groups[value.metadata.labels.demo];
    if (!list) {
        list = [];
        groups[value.metadata.labels.demo] = list;
    }
    list.push(value);
};

var groupByName = function () {
    $.each(pods.items, insertByName);
    $.each(services.items, insertByName);
};

var matchesLabelQuery = function (labels, selector) {
    var match = true;

    if(!labels) { return false; }

    $.each(selector, function (key, value) {
        if (labels[key] !== value) {
            match = false;
        }
    });
    return match;
};

var connectServices = function () {
    connectUses();

    for (var i = 0; i < services.items.length; i++) {
        var service = services.items[i];
        if (service.metadata.name == 'kubernetes') {
            continue;
        }

        for (var j = 0; j < pods.items.length; j++) {

            var pod = pods.items[j];

            if (matchesLabelQuery(pod.metadata.labels, service.spec.selector)) {
                jsPlumb.connect({
                  source: service.metadata.uid,
                  target: pod.metadata.uid,
                  anchors: ["Bottom", "Top"],
                  paintStyle: {
                    lineWidth: 2,
                    strokeStyle: STROKECOLOR
                  },
                  endpointStyle: {
                    fillStyle: STROKECOLOR,
                    radius: 3
                  },
                  joinStyle: "round",
                  connector: ["Flowchart", { cornerRadius: 5 }]
                });
            }
        }
    }
};

var connectUses = function () {
    var colorIx = 0;

    $.each(uses, function (key, list) {

        var color = CONNECTORCOLORS[colorIx];
        colorIx++;
        $.each(pods.items, function (i, pod) {
            if (pod.metadata.labels && pod.metadata.labels.demo == key) {
                $.each(list, function (j, serviceKey) {
                  $.each(services.items, function (j, service) {
                    if (service.metadata.labels && service.metadata.labels.demo == serviceKey) {
                        jsPlumb.connect(
                            {
                                source: pod.metadata.uid,
                                target: service.metadata.uid,
                                endpoint: "Blank",
                                anchors: ["Bottom", "Top"],
                                connector: "Straight",
                                paintStyle: {lineWidth: 2, strokeStyle: color},
                                overlays: [
                                    ["Arrow", { width: 15, length: 30, location: 1}],
                                ],
                            });
                    }
                  });
                });
            }
        });
    });
};

var makeGroupOrder = function () {
    var groupScores = {};
    $.each(uses, function (key, value) {
        if (!groupScores[key]) {
            groupScores[key] = 0;
        }
        $.each(value, function (ix, uses) {
            if (!groupScores[uses]) {
                groupScores[uses] = 1;
            } else {
                groupScores[uses]++;
            }
        });
    });
    $.each(groups, function(key, value) {
      if (!groupScores[key]) {
        groupScores[key] = 0;
      }
    });
    var groupOrder = [];
    $.each(groupScores, function (key, value) {
        groupOrder.push(key);
    });
    groupOrder.sort(function (a, b) {
        return groupScores[a] - groupScores[b];
    });
    return groupOrder;
};


var renderGroups = function () {
    var elt = $('#sheet');
    var y = 10;
    var serviceLeft = 0;
    var groupOrder = makeGroupOrder();
    $.each(groupOrder, function (ix, key) {
        list = groups[key];
        if (!list) {
            return;
        }
        var div = $('<div/>');
        var x = 100;
        $.each(list, function (index, value) {
            var eltDiv = null;
            var span = $('<span style="font-size: 11"/>');
            if (value.type == "pod") {
                eltDiv = $('<div class="window pod" id="' + value.metadata.uid +
                    '" style="left: ' + (x + 50) + '; top: ' + (y + 160) + '"/>');
                span.text(truncate(value.metadata.labels.demo, value.metadata.name));
                eltDiv.append(span);
            } else if (value.type == "service") {
                eltDiv = $('<div class="window wide service" id="' + value.metadata.uid +
                    '" style="left: ' + 75 + '; top: ' + y + '"/>');
                span.text(value.metadata.name + '.' + value.metadata.namespace);
                eltDiv.append(span);
            }
            div.append(eltDiv);
            x += 180;
        });
        y += 400;
        serviceLeft += 200;
        elt.append(div);
    });
};

var insertUse = function (name, use) {
    for (var i = 0; i < uses[name].length; i++) {
        if (uses[name][i] == use) {
            return;
        }
    }
    uses[name].push(use);
};

var loadData = function (namespace) {
    var deferred = new $.Deferred();
    var req1 = $.getJSON('/api/v1/namespaces/' + namespace + '/pods', function (data) {
        pods = data;
        $.each(data.items, function (key, val) {
            val.type = 'pod';

            if (val.metadata.labels) {
                if (val.metadata.labels.uses) {
                    if (!uses[val.metadata.labels.demo]) {
                        uses[val.metadata.labels.demo] = val.metadata.labels.uses.split(",");
                    } else {
                        $.each(val.metadata.labels.uses.split(","), function (ix, use) {
                            insertUse(val.metadata.labels.demo, use);
                        });
                    }
                }
            }
        });
    });

    var req2 = $.getJSON(
      '/api/v1/namespaces/' + namespace + '/services',
      function(data) {
        services = data;
        $.each(data.items, function(key, val) {
          val.type = "service";
        });
      }
    );
    $.when(req1, req2).then(function () {
        deferred.resolve();
    });
    return deferred;
}

jsPlumb.bind("ready", function () {
  reload()
});

var reload = function () {
    $('#sheet').empty()
    jsPlumb.reset()
    //CONFIG = require("./config.json");

    pods = [];
    services = [];
    uses = {};
    groups = {};

    var instance = jsPlumb.getInstance({
        // default drag options
        DragOptions: {cursor: 'pointer', zIndex: 2000},
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: [
            ["Arrow", {location: 1}],
            //[ "Label", {
            //	location:0.1,
            //	id:"label",
            //	cssClass:"aLabel"
            //}]
        ],
        Container: "flowchart-demo"
    });
    var promise = loadData(namespace);
    $.when(promise).then(function () {
        groupByName();
        renderGroups();
        connectServices();
    })
    jsPlumb.fire("jsPlumbDemoLoaded", instance);

    setTimeout(reload, 6000);
};
