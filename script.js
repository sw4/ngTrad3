var ngApp = angular.module('ngApp', []);
ngApp.directive('ngD3Line', [function() {
    return {
        restrict: 'E',
        scope: {
            data: '='
        },
        link: function(scope, element) {
            var timeFormat = d3.time.format("%I:%M:%S");

            var margin = 45,
            width = parseInt(d3.select(element[0]).style("width")) - margin * 2,
            height = parseInt(d3.select(element[0]).style("height")) - margin * 2;

            d3.select(element[0]).append("svg");

            var graph = d3.select(element[0]).select('svg').attr("width", width + margin * 2).attr("height", height + margin * 2).append("g").attr("transform", "translate(" + margin + "," + margin + ")");

            var graphTitle = graph.append("text").attr("x", (width / 2)).attr("y", -15).attr("text-anchor", "middle").attr("class", "graphTitle");

            var xScale = d3.time.scale().range([0, width]);

            var yScale = d3.scale.linear().range([height, 0]);

            var xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(timeFormat);

            var yAxis = d3.svg.axis().scale(yScale).orient("left");

            graph.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);


            graph.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Price $");

            var bidLine = d3.svg.line();

            var askLine = d3.svg.line();

            var tradeLine = d3.svg.line();

            graph.append("path").attr("class", "bidLine").style('pointer-events', 'none');
            graph.append("path").attr("class", "askLine").style('pointer-events', 'none');
            graph.append("path").attr("class", "tradeLine").style('pointer-events', 'none');

            
            var key = d3.select(element[0]).append("div").attr("class", "key").html("<span>BID</span><span>ASK</span><span>TRADE</span>");
            
            
            var bidPath = d3.selectAll('.bidLine');
            var askPath = d3.selectAll('.askLine');
            var tradePath = d3.selectAll('.tradeLine');

            var div = d3.select("body").append("div").attr("class", "legend");

            var bidMarker = graph.append('circle').attr("display", "none").attr('r', 4.5).attr("class", "bidMarker");
            var askMarker = graph.append('circle').attr("display", "none").attr('r', 4.5).attr("class", "askMarker");

            var tradeMarker = graph.append('circle').attr("display", "none").attr('r', 4.5).attr("class", "tradeMarker");

            var yLine = graph.append("line").attr("display", "none").attr("class", "yLine").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", height);
            var xLine = graph.append("line").attr("display", "none").attr("class", "xLine").attr("x1", 0).attr("y1", 0).attr("x2", width).attr("y2", 0);

            var bisect = d3.bisector(function(data) {
                return data.time;
            }).right;

            var overlay = graph.append("rect").attr("class", "overlay").attr("width", width).attr("height", height).on("mouseover", function() {
                var data = scope.data;

                if (!data || data.length < 2) {
                    return false;
                }
                bidMarker.style("display", "block");
                askMarker.style("display", "block");
                tradeMarker.style("display", "block");
                yLine.style("display", "block");
                xLine.style("display", "block");
                div.style("display", "block");
            }).on("mouseout", function() {
                bidMarker.style("display", "none");
                askMarker.style("display", "none");
                tradeMarker.style("display", "none");
                yLine.style("display", "none");
                xLine.style("display", "none");
                div.style("display", "none");
            }).on("mousemove", function() {

                var mouse = d3.mouse(this);

                var data = scope.data;

                if (!data || data.length < 2) {
                    return false;
                }

                bidMarker.attr('cx', mouse[0]);
                askMarker.attr('cx', mouse[0]);
                tradeMarker.attr('cx', mouse[0]);
                div.style("top", mouse[1] + margin + 10 + "px").style("left", mouse[0] + margin + 10 + "px").style("right", "auto");

                var drawWidth = parseInt(d3.select(element[0]).style("width"));
                if (mouse[0] > (drawWidth / 2)) {
                    div.style("right", drawWidth - mouse[0] - margin + 10 + "px").style("left", "auto");
                }
                yLine.attr('x1', mouse[0]).attr('x2', mouse[0]);
                xLine.attr('y1', mouse[1]).attr('y2', mouse[1]);

                var time = xScale.invert(mouse[0]),
                index = bisect(data, time),
                startDatum = data[index - 1],
                endDatum = data[index];

                if (!startDatum || !endDatum) {
                    return false;
                }
                var interpolateBid = d3.interpolateNumber(startDatum.bidPrice, endDatum.bidPrice),
                interpolateAsk = d3.interpolateNumber(startDatum.askPrice, endDatum.askPrice),
                interpolateTrade = d3.interpolateNumber(startDatum.tradePrice, endDatum.tradePrice),
                range = endDatum.time - startDatum.time,
                valueBidY = interpolateBid((time - startDatum.time) / range),
                valueAskY = interpolateAsk((time - startDatum.time) / range),
                valueTradeY = interpolateTrade((time - startDatum.time) / range);

                bidMarker.attr('cy', yScale(valueBidY));
                askMarker.attr('cy', yScale(valueAskY));
                tradeMarker.attr('cy', yScale(valueTradeY));
                div.html("Time: " + timeFormat(xScale.invert(mouse[0])) + " <span class='bid'>Bid: " + valueBidY.toFixed(2) + "</span> <span class='ask'>Ask: " + valueAskY.toFixed(2) + "</span> <span class='trade'>Trade: " + valueTradeY.toFixed(2) + "</span>");

            });

            scope.resize = function() {

                var data = scope.data;
                if (!data) {
                    return false;
                }

                width = parseInt(d3.select(element[0]).style("width")) - margin * 2,
                height = parseInt(d3.select(element[0]).style("height")) - margin * 2;

                xScale.range([0, width]);
                yScale.range([height, 0]);

                yAxis.ticks(Math.max(height / 20, 2));
                xAxis.ticks(Math.max(width / 100, 2));

                graph.attr("width", width + margin * 2).attr("height", height + margin * 2)

                    graph.select('.x.axis').attr("transform", "translate(0," + height + ")").call(xAxis);

                graph.select('.y.axis').call(yAxis);

                graph.selectAll('.bidLine').datum(data).attr("d", bidLine);

                graph.selectAll('.askLine').datum(data).attr("d", askLine);

                graph.selectAll('.tradeLine').datum(data).attr("d", tradeLine);

                overlay.attr("width", width).attr("height", height)

                    yLine.attr("y2", height);
                xLine.attr("x2", width);

                graphTitle.attr("x", (width / 2)).attr("y", -15);

            }

            scope.render = function(data) {

                if (!data) {
                    return false;
                }
                
                xScale.domain(d3.extent(data, function(d) {
                    return d.time;
                }));
                
                yScale.domain([0, 11]);

                bidLine.x(function(d) {
                    return xScale(d.time);
                }).y(function(d) {
                    return yScale(d.bidPrice);
                });

                askLine.x(function(d) {
                    return xScale(d.time);
                }).y(function(d) {
                    return yScale(d.askPrice);
                });

                tradeLine.x(function(d) {
                    return xScale(d.time);
                }).y(function(d) {
                    return yScale(d.tradePrice);
                });

                graph.selectAll('g.axis').remove();

                graph.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

                graph.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("Price $");
                bidPath.datum(data).attr("d", bidLine);
                askPath.datum(data).attr("d", askLine);
                tradePath.datum(data).attr("d", tradeLine);
                scope.$parent.graphCurrency && graphTitle.text("Price vs Time (" + scope.$parent.graphCurrency + ")");

            };

            d3.select(window).on('resize', scope.resize);

            scope.$watch('data', function() {
                if (!scope.data) {
                    return false;
                }
                scope.data = scope.data.slice();
                scope.data.sort(function(a, b) {
                    return a.time - b.time;
                });
                scope.render(scope.data);
            }, true);

        }
    };
}]);
ngApp.controller("dataController", ['$scope', '$interval', 'dataFactory', function($scope, $interval, dataFactory) {

    $scope.quoteSummary = {};
    $scope.quoteList = [];
    $scope.tradeSummary = {};
    $scope.tradeList = [];
    $scope.graphData = [];
    $scope.graphCurrency = null;
    $scope.historicGraphData = [];

    function prepData(data) {

        var time = data.time,
        quoteObj = {},
        tradeObj = {};
        time= new Date(time);
        time=time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
        if (data.identifier === "QUOTE") {
            if (!$scope.quoteSummary[data.currencyPair]) {
                $scope.quoteSummary[data.currencyPair] = {};
            }

            quoteObj = {
                currencyPair: data.currencyPair,
                type: data.type,
                prevAskPrice: parseFloat($scope.quoteSummary[data.currencyPair].askPrice),
                prevAskSize: parseInt($scope.quoteSummary[data.currencyPair].askSize),
                prevBidPrice: parseFloat($scope.quoteSummary[data.currencyPair].bidPrice),
                prevBidSize: parseInt($scope.quoteSummary[data.currencyPair].bidSize),
                bidPrice: parseFloat(data.bidPrice),
                bidSize: parseInt(data.bidSize),
                askPrice: parseFloat(data.askPrice),
                askSize: parseInt(data.askSize),
                time: time
            };
            $scope.quoteSummary[data.currencyPair] = quoteObj;
            $scope.quoteList = $scope.quoteList.slice(0, 99);
            $scope.quoteList.unshift(quoteObj);
        } else {
        
            if (!$scope.tradeSummary[data.currencyPair]) {
                $scope.tradeSummary[data.currencyPair] = {};
            }
            tradeObj = {
                currencyPair: data.currencyPair,
                prevTradePrice: $scope.tradeSummary[data.currencyPair].tradePrice,
                tradePrice: data.tradePrice,
                side: data.side,
                time: time
            }
            $scope.tradeSummary[data.currencyPair] = tradeObj;
            $scope.tradeList = $scope.tradeList.slice(0, 99);
            $scope.tradeList.unshift(tradeObj);
        }

        addGraphData(data);

    }

    $interval(function() {
        prepData(dataFactory.jsonGenerate());
    }, 1000);

    function addGraphData(data) {

        if (!$scope.historicGraphData[data.currencyPair]) {
            $scope.historicGraphData[data.currencyPair] = [];
        }
        var lastItem = $scope.historicGraphData[data.currencyPair][0];

        graphObj = {
            currencyPair: data.currencyPair,
            bidPrice: data.identifier === "QUOTE" && data.type === "BID" ? parseFloat(data.bidPrice) : lastItem ? lastItem.bidPrice: 0,
            askPrice: data.identifier === "QUOTE" && data.type === "ASK" ? parseFloat(data.askPrice) : lastItem ? lastItem.askPrice: 0,
            tradePrice: data.identifier === "TRADE" ? parseFloat(data.tradePrice) : lastItem ? lastItem.tradePrice: 0,
            time: new Date(data.time)
            }

        $scope.historicGraphData[data.currencyPair] = $scope.historicGraphData[data.currencyPair].slice(0, 99);
        $scope.historicGraphData[data.currencyPair].unshift(graphObj);

        if (!$scope.graphCurrency) {
            $scope.graphCurrency = data.currencyPair;
        }
        if ($scope.graphCurrency == data.currencyPair) {
            $scope.graphData.unshift(graphObj);
        }

    }

    $scope.graph = function(currencyPair) {
        $scope.graphCurrency = currencyPair;
        $scope.graphData = $scope.historicGraphData[currencyPair];
    };

    $scope.trade = function(side, event, quote) {
        prepData({
            time: Date.now(),
            currencyPair: $scope.quoteSummary[quote].currencyPair,
            identifier: 'TRADE',
            tradePrice: side === "SELL" ? $scope.quoteSummary[quote].bidPrice: $scope.quoteSummary[quote].askPrice,
            side: side
        });
    };

}]);
ngApp.factory('dataFactory', [function() {
    return {
        jsonGenerate: function() {
            var currencyPairs = ['USDEUR', 'EURUSD', 'USDGBP', 'GBPUSD', 'GBPEUR', 'EURGBP'],
            identifiers = ['QUOTE', 'TRADE'],
            types = ['BID', 'ASK'],
            sides = ['BUY', 'SELL'],
            type = types[Math.floor(Math.random() * types.length)],
            side = sides[Math.floor(Math.random() * sides.length)];
            return {
                time: Date.now(),
                currencyPair: currencyPairs[Math.floor(Math.random() * currencyPairs.length)],
                type: type,
                identifier: identifiers[Math.floor(Math.random() * identifiers.length)],
                askPrice: (Math.random() * (10 - 0 + 1) + 0).toFixed(2),
                askSize: Math.floor(Math.random() * (1000 - 1 + 1)) + 1,
                bidPrice: (Math.random() * (10 - 0 + 1) + 0).toFixed(2),
                bidSize: Math.floor(Math.random() * (1000 - 1 + 1)) + 1,
                tradePrice: (Math.random() * (10 - 0 + 1) + 0).toFixed(2),
                side: side
            }
        }
    };
}]);
