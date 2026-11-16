# From Better Predictions to Better Investment Returns

This project asks whether improving stock-return forecasts improves investment outcomes when the stock universe and trading rules are identical. [Read the blog](https://xia071212.github.io/myrepo/blog/posts/post9/index.html). Classroom portfolio outcomes and the subsequent model backtest are distinct datasets and exercises.

## Data and sources

- Classroom assignment: `Class1/R_Crash_Course_Assignment.pdf`, pages 1 and 30–32. Each portfolio began with $100,000. Portfolio 2 could use indicators, optimized weights and/or XGBoost, so it is not a uniform machine-learning treatment.
- Classroom outcomes: the supplied `Blog9/Full_Results copy.xlsx`, copied locally to `data/classroom_results.xlsx`; 45 paired observations, with no team identifiers or holdings. `results/classroom_returns.csv` preserves row order as anonymous team numbers.
- Original model: the supplied `Class1/UPenn_XGBoostStockPrediction copy.R`, retained unchanged as `code/classroom_original.R` for provenance. It is not the reproduction entry point and contains the instructor's local path conventions where applicable.
- Prices: [Yahoo Finance](https://finance.yahoo.com/), downloaded through [yfinance](https://ranaroussi.github.io/yfinance/) on November 14, 2026, with start January 1, 2022 and exclusive end November 14, 2026. The frozen file is `data/raw/yahoo_prices.csv.gz`. It contains 1,222 observations for each of 95 stocks and SPY, January 3, 2022–November 13, 2026. No stock is excluded. The 95-symbol list is extracted from the classroom script (its comment says 100, but its list contains 95).
- Yahoo `Open`, `High`, `Low`, `Close` and `Volume` enter the original model. Yahoo OHLC is historically split-adjusted; `Adj Close` also adjusts for distributions and is the common return/valuation input. SPY is used only to construct market features, not as an investment comparator. Corporate-action columns are downloaded but do not enter predictors.

An initial alternative-source check was rejected because HON adjusted prices were negative and WMT histories were incomplete. None of those data enter the analysis. The final source passed positive-price, unique-row and complete-field checks. All methods use one frozen Yahoo snapshot; its SHA-256 is in `results/run_summary.json`.

Original prices and the classroom workbook are kept locally and excluded from Git and the portable ZIP. The ZIP contains code and derived results. Obtain the classroom workbook from the course, place it at `data/classroom_results.xlsx`, and acquire prices using the fetch script. Redistribution rights for the original files have not been established. Re-downloaded adjusted prices may change after vendor revisions; exact numerical replication requires the same local frozen snapshot. No claim is made that this is a point-in-time historical database. The fixed stock list does not represent all stocks that existed at each historical date.

## Definitions and analysis design

**Classroom comparison.** Return is final value / 100,000 − 1. Report Portfolio 2 minus Portfolio 1 within each row, its mean, a conventional paired Student t interval and a two-sided paired t test. Shared stock exposure can violate independence between teams; the interval is descriptive evidence, not a causal estimate of XGBoost's effect.

**Target and sample.** With t a signal date, target = adjusted price at t+21 / adjusted price at t+1 − 1, using trading-day offsets. Both model versions and the mean benchmark use this same target, rather than the classroom script's t+20 / t+1 horizon. Features, target availability and stock observations are identical across models. The earliest common usable signal is July 7, 2022. The final training sample has 33,535 rows and all label end dates precede January 1, 2024. Test signals begin January 2, 2024, every 20 sessions; 35 complete holding periods end October 19, 2026. Later data do not complete another 20-session period. There are 3,325 test predictions per method.

**Original XGBoost.** Python XGBoost reproduces the classroom feature and parameter specification, not an exact rerun of the instructor's R software stack. Features include OHLCV, adjusted price, daily stock/SPY return, the original inverse-ratio momentum and reversal definitions, 22-session lagged volatility and current market-relative return. Date/symbol are identifiers. Parameters: 300 trees, depth 5, learning rate 0.05, gamma 0, minimum child weight 10, full row/column samples, L2 penalty 1. All versions use squared-error loss, histogram trees and seed 123. Data source snapshot, target alignment, purging, fixed evaluation dates and equal weights are shared changes. The original code's monthly/daily annualization and mismatched SPY return windows are not used.

**Modified XGBoost.** Predictors are trailing 21/63/126-session momentum ending at t−1; 5-session return ending at t−1; 21-session lagged daily volatility; 21/63-session momentum minus matching SPY momentum; and stock-minus-SPY return at t−1. These remove raw price scales and change the inverse classroom momentum convention into conventional past returns. Two expanding validation folds cover the first and second halves of 2023, evaluated every 20 sessions with labels fully realized within each fold. Every training label ends before its validation window. Eight configurations cross depth 2/3, learning rate .03/.05, and 150/300 trees, with minimum child weight 20, row/column subsampling .8 and L2 penalty 10. Select the smallest equal-fold average MSE, with deterministic candidate order for ties. The selected configuration is 150 trees, depth 2 and learning rate .03. Selection is saved before accessing test predictions. Models are retrained on the same final pre-2024 sample and remain frozen throughout testing.

**Historical mean.** Each stock's forecast is its own mean target in that same final training sample. Forecasts remain fixed in the test period. Its top ten stocks therefore remain constant, but their weights are restored at every common rebalance.

**Prediction metrics.** RMSE covers the same 3,325 stock/date observations and is displayed in percentage points. Rank correlation is Spearman correlation across the 95 stocks at each of 35 signal dates, averaged equally across dates. It evaluates the whole ranking; the investment strategy holds only its top ten.

**Trading rules.** Start with $100,000; at each signal-date close rank predictions, breaking ties by symbol. Trade at the next close, select ten stocks, and give each 10% of post-cost wealth. Trade every 20 sessions; no daily weight reset. Hold long-only, fully invested, even for negative predictions; fractional adjusted-price units are permitted. No leverage, thresholds, stop-loss, take-profit or model-specific timing rules. Adjusted-price units model distribution-adjusted economic exposure, not literal executable share quotes. All close fills assume sufficient liquidity and no additional execution shortfall beyond the stated cost rate.

At a rebalance, let a_i be existing position values and w_i target weights. Solve z + c × sum(abs(w_i × z − a_i)) = pretrade wealth. Thus fees are funded from the portfolio, never borrowed. Main c=.001 per dollar bought or sold; sensitivity rates are 0 and .002. Initial purchases and final liquidation incur fees. Daily marked-to-market wealth yields maximum drawdown, including costs. Mean rebalance trading is sum(abs(trades))/pretrade wealth, excluding initial entry/final liquidation; 140% means purchases plus sales of 1.4 times portfolio wealth, not 140% one-way replacement. Gross and net performance are separately simulated because fees affect subsequent position sizes. The difference in final wealth includes foregone compounding and is not simply fees paid.

## Code and their roles

- `code/fetch_data.py`: downloads the classroom Yahoo source for the fixed universe. Does not overwrite a cached snapshot.
- `code/reproduce.py`: setup, data checks/feature construction, classroom statistics, validation, final models, prediction comparison, self-financing ledger, saved figures and Quarto table includes. Accepts an optional `--output` folder; input paths resolve from the project, independent of working directory.
- `code/classroom_original.R`: unchanged reference implementation, not required for execution.
- `data/universe.json`: the 95 original symbols; SPY is downloaded separately for features.
- `requirements.txt`: package versions used in the tested Python 3.9.6 environment. XGBoost on macOS requires an available OpenMP runtime.

## Results used in the article

- `classroom_summary.json`, `classroom_returns.csv`, `classroom_difference.png`: first section and Figure 1.
- `validation_scores.csv`, `selected_model.json`: validation-only selection evidence.
- `prediction_metrics.csv`, `prediction_table.qmd`: Table 1; full forecasts in `test_predictions.csv`, per-date correlations in `rank_correlations.csv`.
- `investment_metrics.csv`, `investment_table.qmd`, `portfolio_growth.png`: Table 2, Figure 2 and cost sensitivity.
- `daily_equity.csv`, `trade_ledger.csv`: every cost scenario's daily valuation and actual turnover/fees/holdings.
- `selection_diagnostics.csv`: mean and geometric selected-stock holding returns, compounded gross performance, net performance and cost drag; supports the explanation of forecast metrics versus investment returns.
- `holding_period_checks.csv`: direct reconciliation between selected-stock target returns and ledger holding returns.
- `original_model.json`, `modified_model.json`: fitted XGBoost models.
- `data_coverage.csv`, `run_summary.json`: input coverage, sample boundaries, snapshot hash and checks.

## Reproducing the analysis

Create a Python environment with the packages in requirements.txt. Put the course workbook in the location given above. Run code/fetch_data.py if the local frozen prices are unavailable; downloading requires internet and may depend on Yahoo availability. Then run code/reproduce.py. It writes tables, figures, trained models and audit evidence into results without further network calls. The optional output argument lets you reproduce in a separate directory and compare outputs without replacing the delivered results.

The website uses the two saved PNG figures and the two generated table includes. Its article source remains in the website project. [GitHub replication repository](https://github.com/xia071212/blog9repo).
