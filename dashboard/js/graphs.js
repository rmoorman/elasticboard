function makeLink(url, text) {
    var link = $('<a />', {
        href: url,
        text: text,
    });
    return $('<div />').append(link).html();
}

function makeList(container, options) {
    $.getJSON(API_BASE + options.endpoint)
        .done(function (json) {
            $container = $(container);
            $container.append($('<h3 />').text(options.title).addClass('text-center'));
            $list = $('<ul />');

            data = json.data;
            data.forEach(function (e) {
                $item = $('<li />');
                if (typeof options.keyName === 'function') {
                    $item.html(options.keyName(e));
                } else {
                    $item.html(e[options.keyName]);
                }
                $list.append($item);
            });
            $container.append($list);
        })
        .fail(displayFailMessage);
}

function makeXYGraph(container, options) {
    $.getJSON(API_BASE + options.endpoint)
        .done(function (json) {
            data = json.data;
            $(container).highcharts({
                chart: {
                    type: options.type
                },
                title: {
                    text: options.title
                },
                subtitle: {
                    text: options.subtitle
                },
                xAxis: {
                    categories: data.map(function (e) {
                        if (typeof options.keyName === 'function') {
                            return options.keyName(e);
                        }
                        return e[options.keyName];
                    })
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: options.yTitle
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: options.label,
                    data: data.map(function (e) {
                        if (typeof options.valueName === 'function') {
                            return options.valueName(e);
                        }
                        return e[options.valueName];
                    })
                }]
            });
        })
        .fail(displayFailMessage);
}

function makeStackedSeries(data, valueKey) {
    // find all the series
    var seriesNames = [];
    for (var i = 0; i < data.length; ++i) {
        var values = data[i][valueKey];
        var keys = Object.keys(values);
        for (var j = 0; j < keys.length; ++j) {
            var category = keys[j];
            if (seriesNames.indexOf(category) === -1) {
                seriesNames.push(category);
            }
        }
    }

    // get the actual values
    var series = [];
    for (var i = 0; i < seriesNames.length; ++i) {
        var s = {
            name: seriesNames[i],
            data: []
        };
        for (var j = 0; j < data.length; ++j) {
            var d = data[j][valueKey];
            if (d[s.name]) {
                s.data.push(d[s.name]);
            } else {
                s.data.push(0);
            }
        }
        series.push(s);
    }
    return series;
}

function makeStackedGraph(container, options) {
   var graph = {
        chart: {
            type: options.type
        },
        title: {
            text: options.title
        },
        subtitle: {
            text: options.subtitle
        },
        xAxis: {
            categories: options.categories,
            title: {
                enabled: true
            }
        },
        yAxis: {
            title: {
                text: options.yTitle
            },
            min: 0
        },
        legend: {
            labelFormatter: options.legendFormatter
        },
        tooltip: {
            shared: true,
            valueSuffix: ' ' + options.suffix,
            formatter: options.tooltipFormatter
        },
        plotOptions: {},
        series: options.series
    };
    graph.plotOptions[options.type] = {
        stacking: 'normal',
            fillOpacity: 1,
            lineColor: '#666666',
            lineWidth: 1,
            marker: {
            enabled: false
        }
    };
    $(container).highcharts(graph);
}

function drawActivityGraph() {
    $.getJSON(API_BASE + '/total_events_monthly')
        .done(function(data) {
            var series = makeStackedSeries(data.data, 'value');
            var categories = data.data.map(function (e) {
                return e.month;
            });

            var options = {
                type: 'column',
                title: "Activity",
                subtitle: "Total monthly events",
                yTitle: 'Events',
                suffix: 'events',
                series: series,
                categories: categories,
                legendFormatter: function () {
                    var label = this.name;
                    var idx = label.indexOf("Event");
                    if (idx == -1) {
                        idx = label.indexOf("event");
                    }
                    return label.substr(0, idx);
                }
            };
            makeStackedGraph('#total-events-monthly', options);
        })
        .fail(displayFailMessage);
}

function drawActivePeopleGraph() {
    $.getJSON(API_BASE + '/most_active_people')
        .done(function(data) {
            var series = makeStackedSeries(data.data, 'events');
            var categories = data.data.map(function (e) {
                return e.login;
            });

            var options = {
                type: 'bar',
                title: "Most active people",
                subtitle: "By number of events",
                yTitle: 'Events',
                suffix: 'events',
                series: series,
                categories: categories,
                legendFormatter: function () {
                    var label = this.name;
                    var idx = label.indexOf("Event");
                    if (idx == -1) {
                        idx = label.indexOf("event");
                    }
                    return label.substr(0, idx);
                }
            };
            makeStackedGraph('#most-active-people', options);
        })
        .fail(displayFailMessage);
}

function drawPopularityEvolutionGraph() {
    $.getJSON(API_BASE + '/popularity_evolution')
        .done(function(data) {
            var series = makeStackedSeries(data.data, 'value');
            var categories = data.data.map(function (e) {
                return e.month;
            });

            var options = {
                type: 'column',
                title: "Monthly Popularity Increase",
                subtitle: "Number of new stars and forks",
                yTitle: 'Events',
                suffix: '',
                series: series,
                categories: categories,
                legendFormatter: function () {
                    return this.name;
                }
            };
            makeStackedGraph('#popularity-evolution', options);
        })
        .fail(displayFailMessage);
}

function drawGraphs() {
    drawActivePeopleGraph();
    drawActivityGraph();
    drawPopularityEvolutionGraph();

    makeXYGraph('#most-active-issues', {
        endpoint: '/most_active_issues',
        type: 'bar',
        title: "Most active issues",
        keyName: function (e) {
            return makeLink('http://github.com/' + REPO + '/issues/' + e.term,
                            "#" + e.term);
        },
        valueName: 'count',
        yTitle: 'Events',
        label: 'events'
    });
}

