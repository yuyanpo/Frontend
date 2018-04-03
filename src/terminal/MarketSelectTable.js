import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import classNames from 'classnames';
import { defaultFormatValue } from '../generic/util';
import {sortData, onColumnSort, classNameForColumnHeader}  from '../generic/terminalSortFunctions';
import {selectMarket} from '../actions/terminal';
import { connect } from 'react-redux';

class MarketSelectTable extends React.Component {
  constructor(props) {
    super(props);
    const [base, secondary] = props.market.split('-');
    this.state = {
      baseCurrency: base,
      secondaryCurrency: secondary,
      filter: '',
      markets: props.markets.filter(m => m.base === base),
      sort: {},
      hideZeros: false,
    };
    this.onBaseCurrencySelected = this.onBaseCurrencySelected.bind(this);
    this.onSecondaryCurrencySelected = this.onSecondaryCurrencySelected.bind(this);
    this.onChange = this.onChange.bind(this);
    this.sortData = sortData.bind(this);
    this.onColumnSort = onColumnSort.bind(this);
    this.sortFunctions = {
      volume: (a, b) => (a.volume * a.last) - (b.volume * b.last),
      Balance: (a, b) => {
        const first = this.props.apiKey.currencies.find(c => c.name === a.MarketCurrency);
        const bFirst = first ? (first.totalBalance || 0) : 0;
        const second = this.props.apiKey.currencies.find(c => c.name === b.MarketCurrency);
        const bSecond = second ? (second.totalBalance || 0) : 0;
        return bFirst * a.Price - bSecond * b.Price;
      },
    };
    this.onHideZeroClick = this.onHideZeroClick.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  onResize() {
    const total = this.getTableHeight();
    if(this.tableHeigth !== total) {
      this.tableHeight = total;
      this.forceUpdate();
    }
  }

  onHideZeroClick(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState({hideZeros: !this.state.hideZeros});
  }

  onChange(e) {
    this.setState({filter: e.target.value});
  }

  onBaseCurrencySelected(e, base) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    this.setState({
      baseCurrency: base, secondaryCurrency: null,
      markets: this.props.markets.filter(m => m.base === base),
    });
    $('.popover-body .js-dropdown-table-wrapper table').floatThead('reflow');
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.apiKey && !this.props.apiKey) {
      $('.popover-body .js-dropdown-table-wrapper table').floatThead('reflow');
    }
    if(nextProps.markets !== this.props.markets || nextProps.market !== this.props.market) {
      const [base, secondary] = nextProps.market.split('-');
      this.setState({
        baseCurrency: base,
        secondaryCurrency: secondary,
        markets: nextProps.markets.filter(m => m.base === base)
      });
    }
  }

  onSecondaryCurrencySelected(e) {
    e.stopPropagation();
    const currency = e.target.parentElement.dataset.currency;
    const market = this.state.baseCurrency + '-' + currency;
    if(market !== this.props.market) {
      this.props.selectMarket(this.state.baseCurrency + '-' + currency);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    const $table = $('.popover-body .js-dropdown-table-wrapper table');
    $table.on('reflowed', function(e, $floatContainer) {
      let headHeight = $('tr', this).first().height();

      $floatContainer.parent('.floatThead-wrapper').css('padding-top', headHeight);
      $(this).css('margin-top', -headHeight);
    });

    $table.floatThead({
      scrollContainer: function($table){
        let $container = $table.parents('.js-table-wrapper');

        if (!$container.length) {
          $container = $table.parents('.js-dropdown-table-wrapper');
        }

        return $container;
      },
      position: 'absolute',
      // debug: true
    });

  };

  getTableHeight() {
    const $controls = $('.row.dropdowns');
    const $md = $('.marketdepth-chart');
    const total = $md.offset().top + $md.outerHeight() - $controls.offset().top - 145;
    if(this.props.apiKey) {
      return total - 15;
    } else {
      return total;
    }
  }

  render() {
    if(!this.tableHeight) {
      this.tableHeight = this.getTableHeight();
    }
    const baseCurrency = this.state.baseCurrency;
    const isBTC = baseCurrency === 'BTC';
    let sortedData = [];
    if(this.state.markets.length) {
      sortedData = this.sortData(this.state.markets);
    }
    if(this.props.apiKey && this.state.hideZeros) {
      sortedData = sortedData.filter(m => {
        const c = this.props.apiKey.currencies.find(c => c.name === m.MarketCurrency);
        return c && c.totalBalance > 0;
      });
    }
    return (
      <div onClick={e => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }} className="dropdown search">
        <div onClick={this.props.close} className="dropdown__name">
          <span>{this.props.market}</span>
          <span className="arrow_down"></span>
        </div>
        <form action="" className="dropdown__form">
          <input autoComplete="off" value={this.state.filter} type="text" name="filter" onChange={this.onChange} className="input-search" placeholder="Search..."/>
        </form>
        <div className="dropdown__btn-wrap">
          <button
            onClick={e => this.onBaseCurrencySelected(e, 'BTC')}
            className={classNames('dropdown__btn', {active: baseCurrency === 'BTC'})}
          >BTC</button>
          <button
            onClick={e => this.onBaseCurrencySelected(e, 'ETH')}
            className={classNames('dropdown__btn', {active: baseCurrency === 'ETH'})}
          >ETH</button>
          <button
            onClick={e => this.onBaseCurrencySelected(e, 'USDT')}
            className={classNames('dropdown__btn', {active: baseCurrency === 'USDT'})}
          >USDT</button>
        </div>

        <div style={{height: this.tableHeight + 'px'}} className="dropdown-table-wrapper js-dropdown-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => this.onColumnSort('second')}>Currency <span className={classNameForColumnHeader(this.state, 'second')}></span></th>
                <th onClick={() => this.onColumnSort('last')}>Price <span className={classNameForColumnHeader(this.state, 'last')}></span></th>
                <th onClick={() => this.onColumnSort('volume')}>Volume({baseCurrency}) <span className={classNameForColumnHeader(this.state, 'volume')}></span></th>
                <th onClick={() => this.onColumnSort('change')}>Change <span className={classNameForColumnHeader(this.state, 'change')}></span></th>
                {this.props.apiKey ? (
                  <th onClick={() => this.onColumnSort('Balance')}>Balance ({baseCurrency}) <span className={classNameForColumnHeader(this.state, 'Balance')}></span><br/>
                    <div onClick={this.onHideZeroClick}>Hide zeros <div className={classNames('currency_status_checkbox', {selected: this.state.hideZeros})}/>
                    </div>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {
                sortedData
                  .filter(m => m.second.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0)
                  .map(m => (
                    <MarketRow
                      rates={this.props.rates}
                      apiKey={this.props.apiKey}
                      isBTC={isBTC}
                      key={m.symbol}
                      onClick={this.onSecondaryCurrencySelected}
                      market={m}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

MarketSelectTable.propTypes = {
  apiKey: PropTypes.object,
  market: PropTypes.string.isRequired,
  markets: PropTypes.array.isRequired,
  rates: PropTypes.object.isRequired,
  selectMarket: PropTypes.func.isRequired,
};

const MarketRow = ({apiKey, market, onClick, isBTC, rates}) => {
  let balance;
  if(apiKey) {
    const c = apiKey.currencies.find(c => c.name === market.second);
    if(c) {
      balance = c.totalBalance;
    }
    balance = balance || 0;
    balance = balance * rates[market.base][market.second];
  }
  return (
    <tr onClick={onClick} data-currency={market.second} className={market.change >= 0 ? 'up' : 'down'}>
      <td>{market.second}</td>
      <td>{defaultFormatValue(market.last, market.base)}</td>
      <td>{Math.round(market.volume * market.last)}</td>
      <td>{market.change.toFixed(2) + '%'}</td>
      {apiKey ?  (<td>{defaultFormatValue(balance, market.base)}</td>) : null}
    </tr>
  );
};

const mapStateToProps = state => {
  const exchange = state.terminal.exchange;
  const info = state.exchangesInfo[exchange];
  return {
    apiKey: state.terminal.apiKey,
    market: state.terminal.market,
    rates: info && info.rates || {},
    markets: info && info.markets || [],
  };
};

const mapDispatchToProps = dispatch => ({
  selectMarket: market => dispatch(selectMarket(market)),
});
export default connect(mapStateToProps, mapDispatchToProps)(MarketSelectTable);
