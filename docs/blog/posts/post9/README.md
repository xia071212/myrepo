# From Better Predictions to Better Investment Returns

Can better stock-return forecasts improve investment outcomes under identical trading rules? This project compares the classroom XGBoost specification, a modified model and a historical-mean benchmark. The classroom portfolio comparison is a separate exercise.

[Read Blog 9](https://xia071212.github.io/myrepo/blog/posts/post9/index.html) · [Main analysis](https://github.com/xia071212/blog9repo/blob/main/code/reproduce.py)

## Data and sources

| Input | Source and coverage | Local file and purpose |
|---|---|---|
| Classroom outcomes | Supplied `Full_Results copy.xlsx`; 45 paired final balances, initially $100,000 per portfolio | `data/classroom_results.xlsx`: paired return comparison; original row order supplies anonymous team numbers |
| Classroom instructions | `R_Crash_Course_Assignment.pdf`, pp. 1 and 30–32 | Course-provided document: Portfolio 2 could use indicators, optimized weights and/or XGBoost; it is not a uniform machine-learning treatment |
| Original model | Course-provided `UPenn_XGBoostStockPrediction copy.R` | [code/classroom_original.R](https://github.com/xia071212/blog9repo/blob/main/code/classroom_original.R): unchanged reference specification, not the execution entry point |
| Stock universe | The 95 symbols actually listed in the original script; its comment says 100 | [data/universe.json](https://github.com/xia071212/blog9repo/blob/main/data/universe.json): common stock pool; no stock is excluded |
| Daily prices | [Yahoo Finance](https://finance.yahoo.com/) through [yfinance](https://ranaroussi.github.io/yfinance/); downloaded November 14, 2026 | `data/raw/yahoo_prices.csv.gz`: frozen snapshot, January 3, 2022–November 13, 2026; 1,222 observations per stock and SPY |

| Price fields | Use |
|---|---|
| `Open`, `High`, `Low`, `Close`, `Volume` | Original-model predictors; Yahoo historical OHLC prices are split-adjusted |
| `Adj Close` | Distribution-adjusted return calculations and common portfolio valuations |
| SPY prices | Market-relative predictors only; SPY is not an investment comparator |
| Corporate-action fields | Downloaded for reference; not used as predictors |

The download requests January 1, 2022 through the exclusive end date November 14, 2026. Final inputs pass positive-price, unique-row and complete-field checks. The snapshot hash is saved in [run_summary.json](https://github.com/xia071212/blog9repo/blob/main/results/run_summary.json). An initial alternative-source check failed because of negative HON adjusted prices and incomplete WMT histories; none of those records enter this analysis.

**Obtaining the inputs.** The original classroom workbook and price snapshot remain local and are excluded from Git and the downloadable ZIP; redistribution rights have not been established. Obtain the workbook from the course and place it at the path above. The fetch script downloads prices when the snapshot is absent. Vendor revisions can change adjusted prices, so exact numerical replication requires the same frozen snapshot. These data are not a point-in-time historical database, and the fixed stock list does not represent all stocks that existed at each historical date.

## Definitions and analysis design

### Classroom returns

For team $i$ and portfolio $j$, let $V_{i,j}$ be the final dollar value:

$$
R_{i,j}=\frac{V_{i,j}}{100{,}000}-1,
\qquad D_i=R_{i,2}-R_{i,1}.
$$

The analysis reports the mean paired difference, a conventional Student t confidence interval and a two-sided paired t test. Shared stock exposure can violate independence between teams; this comparison is not a causal estimate of XGBoost's effect.

### Prediction target and time split

Let $P_{i,t}$ be the adjusted closing price of stock $i$ on trading day $t$. All three methods predict:

$$
y_{i,t}=\frac{P_{i,t+21}}{P_{i,t+1}}-1.
$$

A signal is formed after the close on day $t$, executed at the next close, and held for 20 trading sessions. The common target replaces the classroom script's original $t+20$ versus $t+1$ price interval.

| Stage | Dates and sample | Rule |
|---|---|---|
| Feature history | Prices from January 3, 2022; first common usable signal July 7, 2022 | Common complete observations across methods |
| Validation fold 1 | First half of 2023 | Train only on labels ending before the window; validation labels must finish within it |
| Validation fold 2 | Second half of 2023 | Expand training history, applying the same label-boundary rule |
| Final training | 33,535 observations; every label ends before January 1, 2024 | Refit both models on the same sample; calculate stock-specific historical means from it |
| Test forecasts | January 2, 2024 onward; 35 dates, spaced 20 sessions apart | 95 stocks per date; 3,325 forecasts per method; no model updates |
| Investment evaluation | January 3, 2024–October 19, 2026 | 35 complete holding periods; later observations do not complete another period |

Validation forecasts are also evaluated every 20 sessions. The selected configuration is saved before test predictions are evaluated.

### Three forecasting methods

| Method | Predictors or forecast | Settings |
|---|---|---|
| Original XGBoost | OHLCV, adjusted price, daily stock/SPY returns, original inverse-ratio momentum and reversal, 22-session lagged volatility, current market-relative return | 300 trees; depth 5; learning rate 0.05; minimum child weight 10; full row/column samples; L2 penalty 1 |
| Modified XGBoost | Conventional 21/63/126-session momentum and 5-session return ending at $t-1$; 21-session lagged volatility; 21/63-session momentum relative to SPY; stock-minus-SPY return at $t-1$ | Selected: 150 trees; depth 2; learning rate 0.03; minimum child weight 20; row/column samples 0.8; L2 penalty 10 |
| Historical mean | Each stock's average target in the final training sample | Fixed during testing; the same ten stocks remain selected, with weights restored at each rebalance |

Both XGBoost models use squared-error loss, histogram trees, gamma 0 and seed 123; dates and stock symbols are identifiers. The modified model removes raw price scales and replaces inverse classroom momentum ratios with conventional past returns.

The eight modified-model candidates cross depths 2/3, learning rates 0.03/0.05 and tree counts 150/300. Selection minimizes equally weighted mean validation MSE across the two folds, with deterministic candidate order for ties. The Python implementation preserves the classroom model's features and specified parameters; it is not an exact rerun of the instructor's R software stack. The data snapshot, target alignment, purging, evaluation dates and equal weighting are standardized across methods. The original script's mismatched SPY return windows and monthly/daily annualization are not used.

For the historical-mean benchmark, $\mathcal{T}_i$ contains stock $i$'s eligible training observations:

$$
\widehat y^{\mathrm{mean}}_{i,t}
=\frac{1}{N_i}\sum_{s\in\mathcal{T}_i}y_{i,s},
\qquad N_i=\lvert\mathcal{T}_i\rvert.
$$

### Prediction metrics

For method $m$, let $\mathcal{E}$ contain the $N=3{,}325$ test observations. RMSE is reported in percentage points:

$$
\operatorname{RMSE}_{m,\mathrm{pp}}
=100\sqrt{\frac{1}{N}\sum_{(i,t)\in\mathcal{E}}
\left(\widehat y^m_{i,t}-y_{i,t}\right)^2}.
$$

Rank correlation is calculated across the 95 stocks at each signal date, then averaged equally over the $K=35$ dates:

$$
\operatorname{IC}_m
=\frac{1}{K}\sum_{t=1}^{K}
\operatorname{SpearmanCorr}_{i}
\left(\widehat y^m_{i,t},y_{i,t}\right).
$$

Lower RMSE and higher rank correlation are better. Both evaluate all 95 stocks; the portfolio holds only the selected top ten. Neither metric alone measures the investment return of those holdings.

### Common trading rules

| Component | Rule shared by all three methods |
|---|---|
| Initial wealth | $100,000 |
| Selection | Ten highest predicted returns; ties broken by stock symbol |
| Execution | Next trading day's close after each signal |
| Allocation | Each selected stock receives 10% of post-cost wealth |
| Rebalancing | Every 20 sessions; weights drift between rebalances |
| Exposure | Fully invested, long-only; invest even when all predictions are negative |
| Additional signals | No leverage, thresholds, stop-loss, take-profit or model-specific timing |
| Main transaction cost | 0.1% per dollar bought or sold; include initial purchases and final liquidation |
| Cost sensitivity | Repeat the ledger with rates 0 and 0.2% |

Fractional adjusted-price units model distribution-adjusted exposure, not literal executable share quotes. Close fills assume sufficient liquidity and no additional execution shortfall beyond the stated cost rate.

At a rebalance, $a_i$ is the existing dollar position, $w_i$ is the target weight, $V^{-}$ is pretrade wealth, $c$ is the cost rate and $z$ is post-cost invested wealth. The ledger solves:

$$
z+c\sum_i\left|w_i z-a_i\right|=V^{-},
\qquad
w_i=\begin{cases}
0.1,&i\text{ is selected},\\
0,&\text{otherwise}.
\end{cases}
$$

Fees are paid from the portfolio, never borrowed. Trading volume relative to pretrade wealth is:

$$
\operatorname{Turnover}_t
=\frac{\sum_i\left|w_i z-a_i\right|}{V^{-}}.
$$

The reported mean excludes initial entry and final liquidation, although both are charged in returns. A value of 140% means purchases plus sales equal 1.4 times portfolio wealth, not 140% one-way replacement.

For each holding period, gross return is the average realized return of the selected stocks. Compounding and maximum drawdown are calculated as follows:

$$
R^{m,\mathrm{gross}}_t=\sum_i w^m_{i,t}y_{i,t},
\qquad
R^{m,\mathrm{gross}}_{\mathrm{total}}
=\prod_{t=1}^{K}\left(1+R^{m,\mathrm{gross}}_t\right)-1.
$$

$$
R^{m,\mathrm{net}}_{\mathrm{total}}=\frac{V^m_T}{V^m_0}-1,
\qquad
\operatorname{MDD}_m
=\max_d\left(1-\frac{V^m_d}{\max_{u\le d}V^m_u}\right).
$$

Here $V^m_d$ is daily wealth after applicable costs. Gross and net ledgers are simulated separately because fees change subsequent position sizes. Their final-wealth difference includes foregone compounding, not just fees paid.

## Code and their roles

The main script follows **Setup → read and engineer data → analyze and save results → create figures and tables**. Paths resolve relative to the project, and output folders are created automatically.

| File | Purpose |
|---|---|
| [code/reproduce.py](https://github.com/xia071212/blog9repo/blob/main/code/reproduce.py) | Complete analysis, validation, fitted models, portfolio ledger and saved outputs; accepts an optional `--output` directory |
| [code/fetch_data.py](https://github.com/xia071212/blog9repo/blob/main/code/fetch_data.py) | Download the fixed universe and SPY from Yahoo; does not overwrite an existing snapshot |
| [code/classroom_original.R](https://github.com/xia071212/blog9repo/blob/main/code/classroom_original.R) | Unchanged classroom reference; not required for execution |
| [data/universe.json](https://github.com/xia071212/blog9repo/blob/main/data/universe.json) | Original 95-stock list; SPY is added separately for market features |
| [requirements.txt](https://github.com/xia071212/blog9repo/blob/main/requirements.txt) | Tested package versions; Python 3.9.6 was used, and macOS XGBoost requires an available OpenMP runtime |

## Results used in the article

All outputs below are saved in `results/`.

| Files | Purpose and article connection |
|---|---|
| [classroom_summary.json](https://github.com/xia071212/blog9repo/blob/main/results/classroom_summary.json), [classroom_returns.csv](https://github.com/xia071212/blog9repo/blob/main/results/classroom_returns.csv), [classroom_difference.png](https://github.com/xia071212/blog9repo/blob/main/results/classroom_difference.png) | Classroom comparison and Figure 1 |
| [validation_scores.csv](https://github.com/xia071212/blog9repo/blob/main/results/validation_scores.csv), [selected_model.json](https://github.com/xia071212/blog9repo/blob/main/results/selected_model.json) | Validation-only model selection |
| [prediction_metrics.csv](https://github.com/xia071212/blog9repo/blob/main/results/prediction_metrics.csv), [prediction_table.qmd](https://github.com/xia071212/blog9repo/blob/main/results/prediction_table.qmd) | Table 1: RMSE and average rank correlation |
| [test_predictions.csv](https://github.com/xia071212/blog9repo/blob/main/results/test_predictions.csv), [rank_correlations.csv](https://github.com/xia071212/blog9repo/blob/main/results/rank_correlations.csv) | Individual test forecasts and date-specific rank correlations |
| [investment_metrics.csv](https://github.com/xia071212/blog9repo/blob/main/results/investment_metrics.csv), [investment_table.qmd](https://github.com/xia071212/blog9repo/blob/main/results/investment_table.qmd), [portfolio_growth.png](https://github.com/xia071212/blog9repo/blob/main/results/portfolio_growth.png) | Table 2, Figure 2 and cost sensitivity |
| [daily_equity.csv](https://github.com/xia071212/blog9repo/blob/main/results/daily_equity.csv), [trade_ledger.csv](https://github.com/xia071212/blog9repo/blob/main/results/trade_ledger.csv) | Daily wealth, holdings, trades and fees for every cost scenario |
| [selection_diagnostics.csv](https://github.com/xia071212/blog9repo/blob/main/results/selection_diagnostics.csv) | Mean/geometric selected-stock returns, compounded gross/net returns and cost drag; explains prediction versus investment outcomes |
| [holding_period_checks.csv](https://github.com/xia071212/blog9repo/blob/main/results/holding_period_checks.csv) | Reconciliation of ledger holding returns with selected-stock targets |
| [original_model.json](https://github.com/xia071212/blog9repo/blob/main/results/original_model.json), [modified_model.json](https://github.com/xia071212/blog9repo/blob/main/results/modified_model.json) | Saved fitted XGBoost models |
| [data_coverage.csv](https://github.com/xia071212/blog9repo/blob/main/results/data_coverage.csv), [run_summary.json](https://github.com/xia071212/blog9repo/blob/main/results/run_summary.json) | Input coverage, sample boundaries, snapshot hash and checks |

## Reproducing the analysis

1. Download the repository with `code/`, `data/` and `results/` intact. Prepare Python with the packages in `requirements.txt`.
2. Obtain the course workbook and place it at `data/classroom_results.xlsx`. If the frozen price snapshot is unavailable, run `code/fetch_data.py`; this requires internet access and Yahoo availability.
3. Run `code/reproduce.py`. It reads the local inputs and saves all results without further network calls. An optional `--output` directory lets you reproduce separately without replacing the delivered files.
4. Inspect the figures and tables in `results/`. The script checks common samples, label boundaries, trade timing, self-financing, ledger/target agreement and cost sensitivity.

The article source and decorative illustration remain in the [website repository](https://github.com/xia071212/myrepo/tree/main/blog/posts/post9). The website uses the two saved analytical figures and generated table fragments. Running the analysis does not render or publish the website.
