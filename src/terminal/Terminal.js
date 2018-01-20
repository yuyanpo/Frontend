import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import HeaderStatus from './HeaderStatus';
import Controls from './Controls';
import TradingView from './TradingView';
import MarketDepth from './MarketDepth';
import PlaceOrder from './PlaceOrder';
import MyOrders from './MyOrders';
import RecentTrades from './RecentTrades';
import OrderBook from './OrderBook';
import { getOrderBook} from '../api/bittrex/bittrex';
import { connect } from 'react-redux';
import { selectApiKey, cancelOrder, selectMarket, placeOrder, getMyOrders, updateTicker } from '../actions/terminal';
import { fetchDashboardData } from '../actions/dashboard';
import MediaQuery from 'react-responsive';

class Terminal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {buy: [], sell: []}
    this.updateTerminal = this.updateTerminal.bind(this);
  }

  allowedApiKeys() {
    const allowedOwnKeys = this.props.apiKeys.ownKeys.filter(k => k.state === 'FREE');
    const allowedReceivedKeys = this.props.apiKeys.receivedKeys.filter(k => {
      const contract = this.props.contracts.find(c => c.keyId === k._id);
      return !!contract;
    });
    return allowedOwnKeys.concat(allowedReceivedKeys);
  }

  updateTerminal() {
    if(this.props.selectedApiKey) {
      this.props.getMyOrders(this.props.selectedApiKey);
    }
    this.timeout = setTimeout(this.updateTerminal, 5000);
  }


  componentWillReceiveProps(props) {
    if(props.selectedMarket !== this.props.selectedMarket) {
      const market = props.selectedMarket;
      clearInterval(this.tickerInterval);
      this.tickerInterval = setInterval(() => this.props.updateTicker(market), 5000);
      this.props.updateTicker(market);
    }
  }

  updateOrderBook(market) {
    getOrderBook(this.props.selectedMarket, 'buy').then(json => {
      if(json.success) {
        let buy = json.result;
        buy.sort((b1,b2) => (b1.Rate - b2.Rate))
        getOrderBook(this.props.selectedMarket, 'sell').then(json => {
          if(json.success) {
            let sell = json.result;
            this.setState({buy: buy, sell: sell});
          }          
        }).catch(err => console.log('error updating order book', err));
      }
    }).catch(err => console.log('error updating order book', err));
  }  

  render() {
    return (
      <Container fluid className="terminal">
        <Row>
          <Col xs="12" sm="12" md="12" lg="12">
            <HeaderStatus
              apiKey={this.props.selectedApiKey}
              market={this.props.selectedMarket}
            />
            <div className="terminal-main">
              <Controls
                market={this.props.selectedMarket}
                apiKeys={this.allowedApiKeys()}
                selectedApiKey={this.props.selectedApiKey}
                onApiKeySelect={key => this.props.selectApiKey(key)}
                onMarketSelect={this.props.selecteMarket}
              />
              <Row className="charts">
                <Col xs="12" sm="12" md="6" lg="8" className="charts__left">
                  <TradingView />
                  <MarketDepth 
                    buy={this.state.buy}
                    sell={this.state.sell}                  
                    market={this.props.selectedMarket}
                  />
                  <Row className="justify-content-between">
                    <PlaceOrder                    
                      ticker={this.props.ticker}
                      placeOrder={this.props.placeOrder}
                      selectedApiKey={this.props.selectedApiKey}
                      market={this.props.selectedMarket}
                    />
                    <MediaQuery query="(min-width: 576px)">
                      <MyOrders
                        market={this.props.selectedMarket}
                        orders={this.props.orders}
                        cancelOrder={this.props.cancelOrder}
                      />
                    </MediaQuery>
                    <MediaQuery query="(max-width: 575px)">
                      <OrderBook
                        buy={this.state.buy}
                        sell={this.state.sell}
                        market={this.props.selectedMarket}
                      />
                    </MediaQuery>
                  </Row>
                </Col>
                <Col xs="12" sm="12" md="6" lg="4">
                  <Row>
                    <MediaQuery query="(min-width: 576px)">
                      <OrderBook
                        buy={this.state.buy}
                        sell={this.state.sell}                      
                        market={this.props.selectedMarket}
                      />
                    </MediaQuery>
                    <MediaQuery query="(max-width: 575px)">
                      <MyOrders
                        market={this.props.selectedMarket}
                        orders={this.props.orders}
                        cancelOrder={this.props.cancelOrder}
                      />
                    </MediaQuery>
                    <RecentTrades
                      market={this.props.selectedMarket}
                    />
                  </Row>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  componentDidMount() {
    window.customize();
    const allowed = this.allowedApiKeys();
    if(!this.props.selectedApiKey) {
      const key = allowed[0]
      this.props.selectApiKey(key);
    } else {
      const key = allowed.find(k => k._id === this.props.selectedApiKey._id);
      if(!key) {
        this.props.selectApiKey(null);
      }
    }
    this.updateTerminal();
    this.props.fetchDashboardData();
    this.interval = setInterval(this.updateOrderBook.bind(this), 5000);
    this.updateOrderBook();    
    const market = this.props.selectedMarket;
    this.tickerInterval = setInterval(() => this.props.updateTicker(market), 5000);
    this.props.updateTicker(market);
  }

  componentWillUnmount() {
    window.uncustomize();
    clearTimeout(this.timeout);
    clearInterval(this.interval);
    clearInterval(this.tickerInterval);
  }
}

const TerminalContainer = connect(state => ({
  apiKeys: state.apiKeys,
  contracts: state.contracts.current,
  selectedApiKey: state.terminal.selectedApiKey,
  selectedMarket: state.terminal.selectedMarket,
  orders: state.terminal.orders,
  ticker: state.terminal.ticker,
}), dispatch => ({
  selectApiKey: key => dispatch(selectApiKey(key)),
  cancelOrder: order => dispatch(cancelOrder(order)),
  selecteMarket: market => dispatch(selectMarket(market)),
  getMyOrders: key => dispatch(getMyOrders(key)),
  fetchDashboardData: () => dispatch(fetchDashboardData()),
  placeOrder: (order, type) => dispatch(placeOrder(order, type)),
  updateTicker: market => dispatch(updateTicker(market)),
}))(Terminal);
export default TerminalContainer;
