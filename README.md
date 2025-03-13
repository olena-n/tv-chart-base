# tv-chart-base
The current documentation is written for a React app, but I am sure it is quite similar to what you will need to do in any other framework.

### The very beginning
First of all, you need to download your version of TV Advanced Charts and place the files in your project or upload them to blob storage, for example.

This tutorial is short and covers the installation and setup of a simple chart.
The steps are as follows:

1. Download the library ZIP file from the Advanced Charts 🔐 (access is restricted): https://github.com/tradingview/charting_library
2. Copy the "charting_library" and "datafeed" folders from the archive to the location where you will store them.
After this, you need to create your chart. First, we need to import the ```widget``` component from the ```charting_library.esm``` file:

```javascript
import { widget as Widget } from 'your_path/charting_library.esm';
```

We also need a container for our chart. In the code example, this container is located on lines 221-229. You need a reference to a div that will serve as your chart container. In our case, we use the reference ```chartContainerRef``` (line 225), which we initialize on line 76.

### Creating an instance of a widget
After importing the widget, creating a base React component (or using another framework), setting up the container, and adding a reference to it, we should create an instance of the widget:

```javascript
const widget = new Widget(getWidgetOptions());
```

We should do this only once, during the first render of the component. You can see this on line 184.
In the widget constructor, we pass widget options, which are returned by the ```getWidgetOptions``` function (line 158). ```getWidgetOptions``` returns an object with your widget options :). You can read more about it [here](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.ChartingLibraryWidgetOptions/).
The most important options to start with are:

```javascript
        container: chartContainerRef.current,
        symbol: asset.AssetTicker,
        datafeed: getDatafeed(),
        interval: '1D',
        library_path: `${BLOB_CDN_URL}/tvchartinglibrary/`, // Here, you should insert your path to the TV library (your unpacked ZIP archive).
        locale: tvChartLocales[locale] || 'en',
```

During cleanup, we remove the widget instance to prevent conflicts with newly created instances (line 200):

```javascript
tvWidget.remove();
```

Any other manipulations with the widget should be performed only [after chart is ready](https://www.tradingview.com/charting-library-docs/latest/core_concepts/widget-methods/#onchartready). For this, we use the ```onChartReady``` callback (line 188). Inside this method, we can create studies or do smth else. For example (line 195):

```javascript
activeChart.createStudy('Overlay', true, false, { symbol: sentimentName }, undefined, { disableUndo: true })
```

More on study creation you can [read here](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IChartWidgetApi/#createstudy).

### How to connect price data?
In your widget options, you need to pass the datafeed parameter. In the example, we use the ```getDatafeed()``` function, which returns a basic setup for a datafeed. This should be an object containing the following fields:
-```onReady```
-```resolveSymbol```
-```getBars```
-```subscribeBars```
-```unsubscribeBars```
You can read more about this [here](https://www.tradingview.com/charting-library-docs/latest/tutorials/implement_datafeed_tutorial/Datafeed-Implementation/).

Here are some comments on the ```getBars``` function:

```javascript
const getBars = async (symbolInfo, resolution, periodParams, onHistoryCallback) => {
    const { firstDataRequest, from, to } = periodParams;
    // Here, you should load your price data and pass it to onHistoryCallback.
    // In this example, we assume that data is loaded only once.
    // If this is a second call (not a firstDataRequest), we also pass an object as a second parameter to onHistoryCallback with the field noData set to true.
    // If you load data in chunks, you can use the from and to parameters from periodParams (both are Unix timestamps).
    // When there is no more price data, return your price data along with { noData: true } as the second parameter. This is important.
    onHistoryCallback(firstDataRequest ? priceData : [], { noData: !firstDataRequest });
};
```

Your price array should contain objects with the following structure:

```javascript
{
    open: roundPrice(open, asset.decimals, true),
    close: roundPrice(close, asset.decimals, true),
    high: roundPrice(high, asset.decimals, true),
    low: roundPrice(low, asset.decimals, true),
    time: date.valueOf(), // Here, we use moment.js to get the number of *milliseconds* since the Unix Epoch.
}
```

The time value should be in *milliseconds since the Unix Epoch*, and OHLC values should be rounded to the number of decimals specified in the ```pricescale``` option of the ```symbolInfo``` in the ```resolveSymbol``` method (line 133).

### Subscribing to widget events
You can subscribe to many widget events (see line 207 for an example). The full list of available events is available [here](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.SubscribeEventsMap/).

If you have any questions, feel free to reach out with [mail](mailto:o.nadon@polytech.software) or [telegram](https://t.me/oceolena)! 😊
