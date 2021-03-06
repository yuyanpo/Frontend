import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import HeaderStatus from '../../components/HeaderStatus';
import Controls from './Controls';
import OrdersTable from './OrdersTable';
import { connect } from 'react-redux';
import { cancelOrder, getOrders, selectExchange, selectFund, getExchangeMarkets, startTradingDataUpdates, stopTradingDataUpdates } from '../../actions/terminal';
import { setFundId } from '../../generic/util';
import { FormattedMessage } from 'react-intl';

class Orders extends React.Component {

  render() {
    const apiKeys = this.props.apiKeys.ownKeys;
    const contracts = this.props.contracts;
    return (
      <Container fluid className="orders">
        <Row>
          <Col xs="12" sm="12" md="12" lg="12">
            <HeaderStatus
              {...this.props.exchangeInfo}
            />
            <div className="orders-main">
              <div className="orders-main__top">
                <div className="row  align-items-center">
                  <div className="orders-main__title">
                    <FormattedMessage
                      id="orders.orders"
                      defaultMessage="Orders"
                    />
                  </div>
                </div>
                <Controls
                  apiKeys={apiKeys}
                  userId={this.props.userId}
                  contracts={contracts}
                  fund={this.props.fund}
                  onApiKeySelect={this.props.selectFund}
                  exchange={this.props.exchange}
                  exchanges={this.props.exchanges}
                  onExchangeSelect={this.props.selectExchange}
                />
              </div>
              <OrdersTable
                orders={this.props.orders}
                cancelOrder={this.props.cancelOrder}
              />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  componentDidMount() {
    this.props.startTradingDataUpdates();
    this.props.selectExchange(this.props.exchange);
    if(this.props.fund) {
      let payload = setFundId({}, this.props.fund);
      this.props.getOrders(payload);
    }
  }

  componentWillReceiveProps(props) {
    if(props.fund && (!this.props.fund || this.props.fund._id !== props.fund._id)) {
      let payload = setFundId({}, props.fund);
      this.props.getOrders(payload);
    }
  }

  componentWillUnmount() {
    this.props.stopTradingDataUpdates();
  }
}

const OrdersContainer = connect(state => ({
  apiKeys: state.apiKeys,
  userId: state.auth.profile._id,
  contracts: state.contracts.current,
  fund: state.terminal.fund,
  orders: state.terminal.orders,
  market: state.terminal.market,
  exchange: state.terminal.exchange,
  exchanges: state.exchangesInfo.exchanges || [],
  exchangeInfo: state.exchangesInfo[state.terminal.exchange],
}), dispatch => ({
  startTradingDataUpdates: () => dispatch(startTradingDataUpdates()),
  stopTradingDataUpdates: () => dispatch(stopTradingDataUpdates()),
  getOrders: params => dispatch(getOrders(params)),
  cancelOrder: order => dispatch(cancelOrder(order)),
  selectExchange: exchange => {
    dispatch(selectExchange(exchange));
    dispatch(getExchangeMarkets(exchange));
  },
  selectFund: fund => dispatch(selectFund(fund)),
  getExchangeMarkets: exchange => dispatch(getExchangeMarkets(exchange)),
}))(Orders);

export default OrdersContainer;
