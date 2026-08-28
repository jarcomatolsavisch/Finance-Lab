def build_opt_portfolio(df_returns):

    # Calculate mean returns and covariance matrix
    mean_returns = df_returns.mean()
    cov_matrix = df_returns.cov()

    # Number of portfolios to simulate
    num_portfolios = 10000

    # Results storage
    results = np.zeros((3, num_portfolios))
    port_wts = []

    for i in range(num_portfolios):
        weights = np.random.random(len(tickers))
        weights /= np.sum(weights)
        port_wts.append(weights)

        # Expected portfolio return
        portfolio_return = np.sum(weights * mean_returns) * 252  

        # Expected portfolio volatility
        portfolio_stddev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * np.sqrt(252)

        # Portfolio Sharpe ratio (assuming risk-free rate is zero)
        sharpe_ratio = portfolio_return / portfolio_stddev

        results[0,i] = portfolio_return
        results[1,i] = portfolio_stddev
        results[2,i] = sharpe_ratio


    # Convert results array to Pandas DataFrame
    results_df = pd.DataFrame(results.T, columns=['Return', 'Volatility', 'Sharpe Ratio'])
    results_df['port_wts'] = [np.round(wt,2) for wt in port_wts]    
    print(results_df)


    # Find the portfolio with the maximum Sharpe ratio
    max_sharpe_portfolio = results_df.iloc[results_df['Sharpe Ratio'].idxmax()]
    print(max_sharpe_portfolio)


    # Find the portfolio with the minimum volatility
    min_volatility_portfolio = results_df.iloc[results_df['Volatility'].idxmin()]

    # Plot the efficient frontier
    plt.figure(figsize=(8, 6))
    plt.scatter(results_df.Volatility, results_df.Return, c=results_df['Sharpe Ratio'], cmap='plasma', marker='o', s=10, alpha=0.3)
    plt.colorbar(label='Sharpe Ratio')
    plt.scatter(max_sharpe_portfolio['Volatility'], max_sharpe_portfolio['Return'], marker='*', color='r', s=200, label='Max Sharpe Ratio')
    plt.scatter(min_volatility_portfolio['Volatility'], min_volatility_portfolio['Return'], marker='*', color='b', s=200, label='Min Volatility')
    plt.title('Efficient Frontier')
    plt.xlabel('Volatility (Annualized)')
    plt.ylabel('Return (Annualized)')
    plt.legend()
    plt.show()