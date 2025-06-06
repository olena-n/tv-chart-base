import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { widget as Widget } from '../../../../../../Scripts/charting_library.esm';
import classes from './TVChart.scss';

// some basic configurational data
const getConfigurationData = (isAI) => ({
    supported_resolutions: ['1D'], // array with suppoerted resolutions, 
    supports_marks: true, // if you are going to show events on the chart, you need to set this to true
});

// you will need to convert your asset type to a tv chart asset type to resolve a symbol
const tvAssetTypes = {
    [assetClasses.Coins.id]: 'crypto',
    [assetClasses.Equity.id]: 'stock',
    [assetClasses.Commodity.id]: 'commodity',
    [assetClasses.Index.id]: 'index',
    [assetClasses.CurrencyPairs.id]: 'forex'
};

// you will need an asset session information when resolving a symbol
// here are the most used sessions
const assetsSessions = {
    // ** '24x7' ---> 24x7
    // ** '0000-0000' ---> starts at 00:00 and ends at 00:00 the following day from Monday to Friday
    // ** '0930-1600' ---> starts at 09:30 and ends at 16:00 from Monday to Friday
    [assetClasses.Coins.id]: '24x7',
    [assetClasses.Equity.id]: '0000-0000',
    [assetClasses.Commodity.id]: '0000-0000',
    [assetClasses.Index.id]: '24x7',
    [assetClasses.CurrencyPairs.id]: '0000-0000'
};

// tv chart locales has their own locales system, here is the example of the transition our locales to the tv locales
const tvChartLocales = {
    'ar-AE': 'ar',
    'zh-tw': 'zh_TW',
    'zh-CN': 'zh',
    'en-GB': 'en',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'id-ID': 'id_ID',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'ms-MY': 'ms_MY',
    'pl-PL': 'pl',
    'pt-PT': 'pt',
    'ru-RU': 'ru',
    'es-ES': 'es',
    'sv-SE': 'sv',
    'th-TH': 'th',
    'tr-TR': 'tr',
    'vi-vn': 'vi'
};

// created a function to get overrides
// here we can change some colors of the chart instances (text/lines/bars/etc)
const getCommonOverrides = (settings) => ({
    'paneProperties.background': settings.primaryBackgroundColor2,
    'scalesProperties.textColor': settings.fontColor,
    'scalesProperties.showSymbolLabels': false,
    'mainSeriesProperties.barStyle.downColor': settings.buyColor,
    'mainSeriesProperties.barStyle.upColor': settings.buyColor,
    'mainSeriesProperties.candleStyle.borderUpColor': settings.buyColor,
    'mainSeriesProperties.candleStyle.borderDownColor': settings.sellColor,
    'mainSeriesProperties.lineStyle.color': settings.fontColor,
    'mainSeriesProperties.showPriceLine': false,
    'paneProperties.separatorColor': settings.primaryBackgroundColor2
});

const sentimentName = 'Gradient Sentiment';
let sentimentId = null;

function TVChartContainer({
    asset, settings, locale
}) {
    // we use ref in widget options
    const chartContainerRef = React.createRef();

    const [tvWidget, setTVWidget] = useState(null); // this is for our widget
    const [chart, setChart] = useState(null); // here we will store ACTIVE chart

  // call this function after we have active chart to override it's styles
    const changeStyles = () => {
        if (!tvWidget) {
            return;
        }

        // applying overrides for a created chart
        tvWidget.chart(0).applyOverrides(getCommonOverrides(settings));

        // here we change some styles of the tv widget (everything outside of a chart)
        tvWidget.setCSSCustomProperty('--tv-color-platform-background', settings.primaryBackgroundColor2);
        tvWidget.setCSSCustomProperty('--tv-color-pane-background', settings.primaryBackgroundColor2);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text', settings.fontColor);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-background-hover', settings.primaryBackgroundColor1);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text-active', settings.accentColor);
        tvWidget.setCSSCustomProperty('--tv-color-popup-background', settings.primaryBackgroundColor1);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-text', settings.fontColor);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-secondary-text', settings.fontColor);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-background-active', settings.accentColor);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-background-expanded', settings.primaryBackgroundColor1);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text-hover', settings.accentColor);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text-active', settings.accentColor);
        tvWidget.setCSSCustomProperty('--tv-color-toolbar-divider-background', settings.primaryBackgroundColor1);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-text-hover', settings.accentColor);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-background-hover', settings.primaryBackgroundColor1);
        tvWidget.setCSSCustomProperty('--tv-color-popup-element-divider-background', settings.fontColor);
    };


    const getBars = async (symbolInfo, resolution, periodParams, onHistoryCallback) => {
        const { firstDataRequest, from, to } = periodParams;
        // here you should load your price data and pass it to the onHistoryCallback
        // in the example I assume that we load data only once, and if it is a second call (not a firstDataRequest) we also pass an object as a second parameter to the onHistoryCallback with field noData equal to true
        // if you load data by portions, you can use from and to parameters from a periodParams (both are Unix timestamps)
        // when you know you have no more price data, you should return your price data and { noData: true } as the second parameter, it is important
        onHistoryCallback(firstDataRequest ? priceData : [], { noData: !firstDataRequest });
    };


    const getDatafeed = () => ({
        onReady: (callback) => {
            setTimeout(() => callback(getConfigurationData(drawSentiment)));
        },
        resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
            const decimals = asset.Decimals;

            const symbolInfo = symbolName === sentimentName
                ? {
                    type: 'undefined',
                    ticker: symbolName,
                    name: symbolName,
                    exchange: '',
                    timezone: 'Etc/UTC',
                    pricescale: 1000,
                    has_intraday: true,
                    visible_plots_set: 'ohlc',
                    has_weekly_and_monthly: false,
                    supported_resolutions: getConfigurationData(drawSentiment).supported_resolutions,
                    volume_precision: 2,
                    data_status: 'streaming',
                    minmov: 1,
                    session: '0000-0000'
                } : {
                    type: tvAssetTypes[asset.AssetClassId],
                    ticker: asset.AssetTicker,
                    name: asset.AssetName,
                    sector: asset.Category,
                    timezone: 'Etc/UTC',
                    pricescale: 10 ** decimals, // precision on the pricescale
                    has_intraday: true, // if you will have intraday data set it to true
                    visible_plots_set: 'ohlc',
                    has_weekly_and_monthly: false,
                    supported_resolutions: getConfigurationData(drawSentiment).supported_resolutions, // array with the suppoerted resolutions
                    volume_precision: 2, 
                    data_status: 'streaming',
                    minmov: 1,
                    session: assetsSessions[asset.AssetClassId]
                };
            setTimeout(() => {
                onSymbolResolvedCallback(symbolInfo);
            }, 0);
        },
        getBars,
        subscribeBars(symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeededCallback) {
          // subscribe if needed, and provide updated bar to the onTick callback
          yourSubscriptionMethod().onUpdate((message) => {
            onTick(message);
          });
        },
        unsubscribeBars(symbol, callback) { /* unsubscribe from here yourSubscriptionMethod */ },
    });


    const getWidgetOptions = () => ({
        container: chartContainerRef.current,
        symbol: asset.AssetTicker,
        datafeed: getDatafeed(),
        interval: '1D',
        library_path: `${BLOB_CDN_URL}/tvchartinglibrary/`, // here you should paste yout path to the tv library (your unpacked zip archive)
        locale: tvChartLocales[locale] || 'en',
        enabled_features: ['fix_left_edge', 'iframe_loading_compatibility_mode', 'low_density_bars', 'determine_first_data_request_size_using_visible_range'],
        disabled_features: ['use_localstorage_for_settings', 'header_symbol_search', 'header_compare', 'study_templates', 'request_only_visible_range_on_reset'],
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        fullscreen: false,
        autosize: true,
        studies_overrides: { 'Overlay.style': 10 },
        overrides: {
            'paneProperties.crossHairProperties.color': settings.accentColor,
            'mainSeriesProperties.style': 1,
            ...getCommonOverrides(settings)
        },
        // uncomment next line to get more information about inner proccesses of the widget:
        // debug: true
    });

      // Create a function, which will recalculate baseline level
      const setBaselineLevel = async () => {
        if (!chart || !sentimentId) {
            return;
        }

        const sentimentOverlay = await chart.getStudyById(sentimentId);
        const priceScale = await chart.getPanes()[0].getLeftPriceScales()[0];
        const { from, to } = await priceScale?.getVisiblePriceRange();

        let baseLevelPercentage;
        if (from > 0 && to > 0) {
            baseLevelPercentage = 0;
        } else if (from < 0 && to < 0) {
            baseLevelPercentage = 100;
        } else {
            baseLevelPercentage = Math.abs(from) / Math.abs(from - to) * 100;
        }

        sentimentOverlay.applyOverrides({
            'baselineStyle.baseLevelPercentage': baseLevelPercentage
        });
    };

    useEffect(() => {
        const widget = new Widget(getWidgetOptions()); // creating a widget instance
        setTVWidget(widget);

        // you should make all manipulations with a widget after it is ready to use, for example, creating of a study 
        widget.onChartReady(async () => {
            const activeChart = widget.activeChart();

            activeChart.setChartType(1);
            setChart(activeChart);

            // here we add our sentiment to the chart
            sentimentId = await activeChart.createStudy('Overlay', true, false, { symbol: sentimentName }, undefined, { disableUndo: true });

            widget.subscribe('study', (study) => {
                  new Promise((resolve) => {
                      if (!sentimentId && study.value === sentimentName) {
                          sentimentId = widget.chart(0).createStudy('Overlay', true, false, { symbol: sentimentName }, undefined, { disableUndo: true });
                      }
                      resolve(true);
                  }).then(() => {
                      widget.chart(0).getAllStudies().forEach(({ name, id }) => {
                          if (name === sentimentName) {
                              widget.chart(0).removeEntity(id);
                          }
                      });
                  });
              });
        });

        return () => {
            // clean up
            tvWidget.remove();
        };
    }, []);

    useEffect(() => {
      if (tvWidget) {
        tvWidget.subscribe('mouse_down', () => {
            setBaselineLevel();
        });
  
        tvWidget.subscribe('mouse_up', () => {
            setBaselineLevel();
        });
  
        tvWidget.subscribe('study_properties_changed', (id) => {
            if (id === sentimentId) {
                setBaselineLevel();
            }
        });
  
        tvWidget.subscribe('undo_redo_state_changed', () => {
            setBaselineLevel();
        });
  
        tvWidget.subscribe('reset_scales', () => {
            setBaselineLevel();
        });
  
        tvWidget.subscribe('study_event', (id, eventType) => {
            if (id === sentimentId && eventType === 'remove') {
                sentimentId = undefined;
            } else {
                setBaselineLevel();
            }
        });
      }
    }, [chart, tvWidget]);


    useEffect(() => {
        if (chart) {
            // we change active chart styles every time it is being changed
            changeStyles();
            setBaselineLevel();
        }
    }, [chart]);


    return (
        <div className={classes.wrapper} style={{ width: '100%' }}>
            <div className={classes.chartWrapper} style={{ width: '100%' }}>
                <div
                    style={{ width: '100%' }}
                    ref={chartContainerRef}
                    className={`TVChartContainer ${classes.chart}`}
                />
            </div>
        </div>
    );
}

// some react stuff we need
TVChartContainer.propTypes = {
    settings: PropTypes.object.isRequired,
    locale: PropTypes.string.isRequired,
    asset: PropTypes.object,
};

TVChartContainer.defaultProps = {
    asset: null
};

export default TVChartContainer;
