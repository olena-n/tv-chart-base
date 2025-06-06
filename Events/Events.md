# Chart Events (Marks)  

_In TradingView documentation, chart events are referred to as marks._
_Adding marks/timescale marks to a chart is straightforward in TradingView, so instead of including separate example file, a relevant example will be provided within this document and explain everything._  

Marks are requested from your datafeed if you set ```supports_marks``` or ```supports_timescale_marks``` to true. The library calls ```getMarks``` to get mark data for the visible data range.  
You can draw marks on the timescale (via ```getTimescaleMarks```, and need ```supports_timescale_marks``` in the configuration of the datafeed) or on the candle (```getMarks``` and ```supports_marks```).   

### Steps to follow:  
1. In the ```getDatafeed``` method in the ```onReady``` function we must pass a configurational data wich will enable marks on the chart:
```javascript
getDatafeed = () => ({
        onReady: (callback) => {
            setTimeout(() => callback({ supports_timescale_marks: true }));
        },
        getTimescaleMarks: getTimescaleMarks, // here we will pass a function which will reqquest our events
        getBars() { },
        resolveSymbol() { },
        subscribeBars() { },
        unsubscribeBars() { }
});
```
2. Create a function to request events:  
```javascript
    getTimescaleMarks = async (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
        const { events } = await loadEvents(); // request your events here
        const mappedEvents = await mapEventsToDates(events, resolution === '60' ? 'hour' : 'day'); // here you should implement your own logic to check event dates to be same as your price dates
        // ensure the time corresponds to a bar on the chart, or the mark won't show up. for example, if time is not same ->
        // -> then you can map it to match price time, so it will be rendered in the correct day/hour/whatever resolution you use, ->
        // -> and you can write precise time of the event in the tooltip text if needed

        if (mappedEvents) {
            const marks = mappedEvents.map((x) => ({
                id: x.id,
                time: x.time,
                labelFontColor: "#000",
                minSize: 25,
                tooltip: 'dividends explanation',
                label: 'D',
                color: "#fff",
                imageUrl: // img url if you want an image instead of a symbol
            }));

            // in my example I also save evets to the state, to reffer to them if needed
            // and after saving events, we call onDataCallback to draw marks on the chart
            this.setState((state) => ({ events: { ...state.events, ...mappedEvents } }), () => { onDataCallback(marks); });
        }
    }
```

**Parameters explanation:**
+ ```time``` ->	UNIX timestamp in seconds (not milliseconds)  
+ ```price``` ->	The y-axis value where the mark appears  
+ ```tooltip``` ->	Tooltip or label text shown on hover  
+ ```label``` ->	Short letter or icon shown inside the shape  
+ ```color``` ->	The background color of the mark  
+ ```labelFontColor``` ->	The font color of the label inside the mark  
+ ```shape``` ->	The type of shape (```arrow_up```, ```arrow_down```, ```circle```, ```flag```, ```diamond```)  
+ ```id``` ->	Unique ID to track or remove the mark later

**To clear all marks on the chart:**  

```this.tvWidget.chart(0).clearMarks();```  

**To remove a particular mark by ID:**  

```chart.removeEntity('custom-mark-group');```  
Or to replace/update a mark, just call ```createMultipointShape``` again with the same ```id```.  

**! Important !**  
You must call marks creation inside ```widget.onChartReady()``` or ensure the chart is fully initialized.  
Dont forget to pass configurational data ```supports_marks``` or ```supports_timescale_marks``` to true.  
Time must be in seconds (not milliseconds like JavaScript Date.now()).  
Ensure the time corresponds to a bar on the chart, or the mark won't show up.  


