# How to Add a Sentiment to a TV Chart?

_See examples to the doc in the ./Sentiment.js._  
_Unfortunately, TradingView advanced_charts don't provide a possibility to create a chart of this type, but there is a workaraound._

**1.** First of all, define a name for a sentiment (this name will be shown everywhere on UI) and a sentiment id (it will be changed every time we create/delete sentiment on the chart). _(lines 71 and 72)_.  
  
**2.** In the resolveSymbol function we can pass whatever symbol info we want to pass when we are trying to load a data for our sentiment _(lines 129-145)_.  
This is not necessarily to be done, but it is better to define this.  
  
**3.** Important! In the widget options we need to change styles of the Overlay study to 10: ```studies_overrides: { 'Overlay.style': 10 }``` _(line 190)_.  
  
**4.** Create a function, which will recalculate baseline level (by default baseline is set in the middle of the chart, not 0, and we will need to fix it). _(line 201)_.    
Here you can your own logic of setting a baseline level.

   Let's breakdown this step more precisely:
   
```javascript
const sentimentOverlay = await chart.getStudyById(sentimentId);
// Fetches the sentiment overlay (e.g., a visual layer like an indicator) by its ID from the chart:

const priceScale = await chart.getPanes()[0].getLeftPriceScales()[0];
// Gets the first price scale from the left side of the first pane of the chart (we will create our sentiment related to this pricescale).

const { from, to } = await priceScale?.getVisiblePriceRange();
// Retrieves the currently visible price range on that price scale. from and to represent the lower and upper bounds of that range.
```

Baseline level can be set only in percentage, not in the price values! And here is a logic of definening a basline level:
```javascript
    let baseLevelPercentage;
    if (from > 0 && to > 0) {
        baseLevelPercentage = 0;
    } else if (from < 0 && to < 0) {
        baseLevelPercentage = 100;
    } else {
        baseLevelPercentage = Math.abs(from) / Math.abs(from - to) * 100;
    }
```
This determines how far the zero price level is within the visible range, to position the baseline accordingly:
All prices positive → baseline at 0% (bottom).
All prices negative → baseline at 100% (top).
Mixed positive & negative → baseline somewhere in the middle, based on proportion.
The formula: ```Math.abs(from) / Math.abs(from - to) * 100``` calculates where zero lies between from and to, as a percentage.

At the end, we need to apply the calculated baseLevelPercentage to the overlay—likely affecting where the baseline (e.g. zero line) appears visually.
```javascript
    sentimentOverlay.applyOverrides({
        'baselineStyle.baseLevelPercentage': baseLevelPercentage
    });
```
  
**5.** And now it's time to add our sentiment to the chart. _(line 236)_.  
We need to do this on the component mount.
```javascript
sentimentId = await activeChart.createStudy('Overlay', true, false, { symbol: sentimentName }, undefined, { disableUndo: true });
```
More on createStudy parameters you can [read here](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IChartWidgetApi/#createstudy).  
  
After this, we listen for study events, and if the correct sentiment study appears and hasn’t been added yet, we create a new sentiment overlay, and after that we remove any studies on the chart with the same name to avoid duplicates:
```javascript
// Subscribe to 'study' events on the TradingView widget
widget.subscribe('study', (study) => {
    // Wrap the logic in a Promise for controlled flow (even though this part is synchronous)
    new Promise((resolve) => {
        // Check if a sentiment study hasn't been added yet and the incoming study matches the desired sentiment name
        if (!sentimentId && study.value === sentimentName) {
            // Create a new Overlay study with the sentiment symbol
            sentimentId = widget.chart(0).createStudy('Overlay', true, false, { symbol: sentimentName }, undefined, { disableUndo: true });
        }

        // Resolve the promise immediately (this structure allows chaining)
        resolve(true);
    }).then(() => {
        // After the sentiment study is created, clean up any duplicate studies

        // Get all studies currently on the chart
        widget.chart(0).getAllStudies().forEach(({ name, id }) => {
            // If a study matches the sentiment name, remove it
            widget.chart(0).removeEntity(id);
        });
    });
});
```

**6.** We need to recalculate basline level every time user interacts with a chart, so we need to subscribe to events like ```mouse_down```, ```mouse_up```, ```study_properties_changed```, ```undo_redo_state_changed```, ```reset_scales``` and ```study_event``` _(lines 260-292)_.
  
**7.** We also need to recalculate baseline level position when the ```chart``` changes _(line 299)_.   

**8.** Chart with a sentiment is redy :)  
