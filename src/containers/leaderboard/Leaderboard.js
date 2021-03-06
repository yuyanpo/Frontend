import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import PropTypes from 'prop-types';
import times from 'lodash.times';
import qs from 'qs';
import { injectIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import { UncontrolledTooltip } from 'reactstrap';
import {updateChallenge, getNextInfo, takePart, applyForContract} from '../../actions/challenge';
import {showConfirmModal} from '../../actions/modal';
import {connect} from 'react-redux';
import RoundSelect from './RoundSelect';
import ReactTable from '../../components/SelectableReactTable';
import createMqProvider, {querySchema} from '../../MediaQuery';

const { Screen} = createMqProvider(querySchema);

const infoTableData= [
  {
    place:'1',
    point: '100'
  },{
    place:'2',
    point: '75'
  },{
    place:'3',
    point: '50'
  },{
    place:'4',
    point: '35'
  },{
    place:'5',
    point: '25'
  },{
    place:'6-10',
    point: '15'
  },{
    place:'11-20',
    point: '10'
  },{
    place:'21-50',
    point: '5'
  },{
    place:'51-100',
    point: '3'
  },{
    place:'101+',
    point: '1'
  }];


class Leaderboard extends React.Component {
  static propTypes = {
    maxDisplayedTabs: PropTypes.number,
  };

  static defaultProps = {
    maxDisplayedTabs: 4,
  };


  constructor(props) {
    super(props);
    this.onNameFilterChange = this.onNameFilterChange.bind(this);
    this.state = {
      selectedRound: 0,
      nameFilter: '',
      sort: {},
    };
    this.inputRef = React.createRef();
    this.selectRound = this.selectRound.bind(this);
  }

  componentDidMount() {
    if (this.props.loggedIn) {
      this.props.getNextInfo();
    }
    const { round } = qs.parse(this.props.location.search.slice(1));
    if (round && round.match(/^[0-9]+$/)) {
      this.selectRound(parseInt(round, 10));
    }
    else {
      this.selectRound(0);
    }
  }

  onNameFilterClick = (e) => {
    e.stopPropagation();
  }

  onContractApply = (free) => {
    if (!this.props.loggedIn) {
      this.props.history.push('/login');
      return;
    }
    this.props.showConfirmModal('leaderboard.payContractHeader', {},
      () => {
        this.props.applyForContract(free._id);
      }, {
        textId: 'leaderboard.payContractConditions',
        values: {
          expiresAt: new Date(free.expiresAt).toLocaleDateString(),
          maxLoss: free.maxLoss,
          amount: free.amount,
          deposit: (free.amount * free.maxLoss / 100).toFixed(2),
          br: <br/>,
          attention: <b>Attention:</b>,
        },
        confirmText: 'leaderboard.payContract',
        cancelText: 'leaderboard.cancel',
      }
    );
  }
  componentDidUpdate(prevProps) {
    if (prevProps.challenge
      && prevProps.challenge.nextRound === false
      && this.props.challenge.nextRound
      && this.props.challenge.global) {
      this.selectRound(0);
    }
  }

  selectRound(number) {
    const { updateChallenge } = this.props;
    this.props.history.replace({
      pathname: '/leaderboard',
      search: number > 0 ? `round=${number}` : '',
    });
    clearInterval(this.interval);
    updateChallenge(number);
    this.setState({selectedRound: number});
    this.interval = setInterval(() => updateChallenge(number), 30000);
  }

  onTakePartClick = () => {
    this.props.takePart();
  }

  onRowClick = (state, rowInfo) => {
    return {
      onClick: e => {
        if(e.target.tagName === 'A') {
          return;
        }
        if (rowInfo.original.static) {
          return;
        }
        const name = rowInfo.original.name;
        this.props.history.push(`/${name}`);
      }
    };
  }

  onNameFilterChange(e) {
    this.setState({nameFilter: e.target.value});
  }

  render() {
    const { selectedRound } = this.state;
    if(this.inputRef.current && document.activeElement === this.inputRef.current) {
      this.shouldFocus = true;
    } else {
      this.shouldFocus = false;
    }
    let roundInfo = null;
    let results = [];
    let count = 0;
    const {challenge} = this.props;
    if(challenge) {
      count = challenge.count;
      if(challenge.global && selectedRound === 0) {
        roundInfo = null;
        results = challenge.results;
      } else if(
        challenge.roundInfo &&
        challenge.roundInfo.number === this.state.selectedRound
      ) {

        roundInfo = challenge.roundInfo;
        results = challenge.results;
      }
      if (roundInfo && roundInfo.state === 'RUNNING'
        && challenge.free && challenge.free.length > 0) {
        results = challenge.free.concat(results);
      }
    }
    const nameFilter = this.state.nameFilter.toLowerCase();
    results = results.filter(({name}) => name.toLowerCase().includes(nameFilter));
    const isSelectedRoundExist = count >= selectedRound;
    return (
      <Container fluid className="ratings leaderboard">
        <Screen on={screenWidth => (
          <Row>
            <Col xs="12" sm="12" md="12" lg="12">
              <div className="ratings-main">
                <div className="ratings-main__title">
                  <FormattedMessage
                    id="leaderboard.title"
                    defaultMessage="LEADERBOARD"
                  />
                </div>
                {this.renderNextRoundButton()}
                <div className="ratings-main__block">
                  <div className="block__top">
                    <div className="block__top-switch-wrap">
                      {this.renderRoundsBlocks(count)}
                    </div>
                  </div>
                  {this.renderBoard(results, roundInfo, isSelectedRoundExist, screenWidth)}
                </div>
                <div className="leaderboard__info legend">
                  <span className="red_square" />
                  <div className="leaderboard__title">
                    <FormattedMessage id="leaderboard.legend" defaultMessage="Red row indicate that user exceeded max loss. Such users skip next round"/>
                  </div>
                </div>
                <div className="leaderboard__info">
                  {this.renderInfoBoard(screenWidth)}
                </div>
              </div>
            </Col>
          </Row>
        )} />
      </Container>
    );
  }

  renderNextRoundButton() {
    const { loggedIn, challenge } = this.props;
    if (!loggedIn) {
      return null;
    } else {
      const canParticipate = challenge && challenge.nextRound !== undefined && !challenge.nextRound;
      return (
        <div className="leaderboard__form">
          <span className="leaderboard__title">
            <FormattedMessage
              id="leaderboard.nextRoundMessage"
            />
            <div id="help-icon-tx" className="table_header_help_wrapper"/>
          </span>
          <button disabled={!canParticipate} type="submit" onClick={this.onTakePartClick} className="leaderboard__form-submit">
            <FormattedMessage
              id="leaderboard.nextRoundConfirm"
            />
          </button>
          <UncontrolledTooltip target="help-icon-tx">
            <FormattedMessage
              id="leaderboard.nextRoundHelp"
            />
          </UncontrolledTooltip>
        </div>
      );
    }
  }

  renderBoard(data, roundInfo, isSelectedRoundExists, screenWidth) {
    const { selectedRound } = this.state;
    const isGlobalRound = selectedRound === 0;
    if (!isSelectedRoundExists) {
      return this.renderMissingRoundNotice();
    }
    else if (data) {
      return this.renderGlobalBoard(data, isGlobalRound, screenWidth, selectedRound);
    }
    else {
      return null;
    }
  }

  renderRoundsBlocks(count) {
    const {location: {pathname : path}} = this.props;
    const {selectedRound } = this.state;
    return  <RoundSelect
      key="dropdown"
      path={path}
      onSelectClick={RoundNumber => this.selectRound(RoundNumber)}
      currentValue={selectedRound}
      rounds={times(count, (i) => 1 + i).reverse()}
      targetId="leaderboard__select"
      elementClassName="leaderboard__select-list-item"
      dropdownClassName="leaderboard__select-wrapper"
    />;
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getGlobalColumns = (screenWidth) => {
    return [
      {
        Header: null,
        maxWidth: screenWidth === 'lg' ? 80 : 40,
        className: 'ratings__table-cell',
        Cell: row =>
          (
            <div>
              {row.viewIndex + 1}
            </div>
          ),
        sortable: false,
      }, {
        Header:<div className="table__header-wrapper">
          <div>
            <FormattedMessage
              id="leaderboard.name"
              defaultMessage="Name"
            />
          </div>
          <div>
            <input ref={this.inputRef}
              onClick={this.onNameFilterClick}
              value={this.state.nameFilter}
              onChange={this.onNameFilterChange}
              type="text"
              className="ratings__input-search"
              placeholder={this.props.intl.messages['leaderboard.searchPlaceholder']} />
          </div>
        </div>,
        minWidth: 80,
        className: 'ratings__table-cell',
        Cell: row => {
          return <div className="name nickname">@{row.value}</div>;
        },
        accessor: 'name',
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="leaderboard.average"
              defaultMessage="Average"
            />
          </div>
        </div>,
        minWidth: screenWidth === 'lg' ? 80 : 50,
        Cell: row => row.original.average,
        className: 'ratings__table-cell',
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="leaderboard.points"
              defaultMessage="Points"
            />
          </div>
        </div>,
        minWidth: screenWidth === 'lg' ? 80 : 50,
        className: 'ratings__table-cell',
        accessor: 'points'
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="leaderboard.nextRound"
              defaultMessage="Next round"
            />
          </div>
        </div>,
        minWidth: screenWidth === 'lg' ? 80 : 50,
        Cell: row => row.value ? (
          <FormattedMessage
            id="yes"
            defaultMessage="yes"
          />) : (
          <FormattedMessage
            id="no"
            defaultMessage="no"
          />),
        className: 'ratings__table-cell',
        accessor: 'next',
      },
    ];
  }

  getRoundColumns = (screenWidth) => {
    return [
      {
        Header: null,
        maxWidth: screenWidth === 'lg' ? 80 : 40,
        className: 'ratings__table-cell',
        Cell: row =>
          (
            <div>
              {row.viewIndex + 1}
            </div>
          ),
        sortable: false,
      }, {
        Header:<div className="table__header-wrapper">
          <div>
            <FormattedMessage
              id="leaderboard.name"
              defaultMessage="Name"
            />
          </div>
          <div>
            <input ref={this.inputRef}
              onClick={this.onNameFilterClick}
              value={this.state.nameFilter}
              onChange={this.onNameFilterChange}
              type="text"
              className="ratings__input-search"
              placeholder={this.props.intl.messages['leaderboard.searchPlaceholder']} />
          </div>
        </div>,
        getProps: (state, rowInfo) => {
          return {
            style: {
              color: rowInfo.row._original.maxLoss === true ? '#CB353C' : null,
            }
          };
        },
        minWidth: 80,
        className: 'ratings__table-cell',
        Cell: row => {
          if (!row.value) {
            return <div className="ratings__table-cell">Vacant</div>;
          } else {
            return <div className="name nickname">@{row.value}</div>;
          }
        },
        accessor: 'name',
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="terminal.amountLabel"
              defaultMessage="Amount ({amount}) "
              values={{amount: 'USDT'}}
            />
          </div>
        </div>,
        getProps: (state, rowInfo) => {
          return {
            style: {
              color: rowInfo.row._original.maxLoss === true ? '#CB353C' : null,
            }
          };
        },
        minWidth: screenWidth === 'lg' ? 80 : 40,
        Cell: row => row.value,
        className: 'ratings__table-cell',
        accessor: 'amount',
      }, {
        Header: <div
          className="table__header-wrapper">
          <FormattedMessage
            id="leaderboard.profitUsd"
            defaultMessage="Profit (USDT)"
          />
        </div>,
        className: 'ratings__table-cell',
        getProps: (state, rowInfo) => {
          return {
            style: {
              color: rowInfo.row._original.maxLoss === true ? '#CB353C' : null,
            }
          };
        },
        minWidth: screenWidth === 'lg' ? 80 : 40,
        Cell: row => (<ProfitCell tx={row.original.tx} profit={row.original.profit} />),
        accessor: 'profit',
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="leaderboard.profitPercent"
              defaultMessage="Profit, %"
            />
          </div>
        </div>,
        getProps: (state, rowInfo) => {
          return {
            style: {
              color: rowInfo.row._original.maxLoss === true ? '#CB353C' : null,
            }
          };
        },
        minWidth: screenWidth === 'lg' ? 80 : 50,
        Cell: row => {
          if (!row.original.static) {
            return row.value.toFixed(2);
          } else {
            return (
              <button type="submit" onClick={(e) => this.onContractApply(row.original)} className="leaderboard__form-submit get_contract_button">Get Contract</button>
            );
          }
        },
        className: 'ratings__table-cell get_contract',
        accessor: 'percent',
      }, {
        Header: <div
          className="table__header-wrapper">
          <div className="rating__header-title-wrapper">
            <FormattedMessage
              id="leaderboard.points"
              defaultMessage="Points"
            />
          </div>
        </div>,
        getProps: (state, rowInfo) => {
          return {
            style: {
              color: rowInfo.row._original.maxLoss === true ? '#CB353C' : null,
            }
          };
        },
        minWidth: screenWidth === 'lg' ? 80 : 50,
        Cell: row => {
          if (typeof row.value === 'number') {
            return row.value.toFixed(2);
          } else {
            return '';
          }
        },
        className: 'ratings__table-cell',
      }
    ];
  }

  renderRound = info => {
    if(info) {
      return (
        <div className="round_info">
          <div>{formatDate(new Date(info.dtStart))} - {formatDate(new Date(info.dtEnd))}</div>
          <div>{info.state}</div>
        </div>
      );
    } else {
      return null;
    }
  };

  renderMissingRoundNotice = () => (
    <div className="ratings-tabs">
      <div className="ratings-tab ratings-traders active">
        <div className="ratings-table-wrap">
          <div className="ratings-empty-data">
            <FormattedMessage
              id="leaderboard.roundIsNotStartedYet"
              defaultMessage="Round {round} is not started yet"
              values={{
                round: this.state.selectedRound
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  renderInfoBoard = screenWidth => (
    <div>
      <div className="leaderboard__title">
        <FormattedMessage id="leaderboard.infoTitle" defaultMessage="How many tokens I will earn from postions at the Leaderboard"/>
      </div>
      <div className="leaderboard__annotation">
        <FormattedMessage
          id="leaderboard.annotationInfo"
          defaultMessage="After each round of the competition, every participant receives Tournament Points according the their weekly ratings. The exact amount of points is shown in the table below. After all rounds of competition those Points will be converted into MBN tokens in rate 1/1000.{br}For example, Alice took 1st position at weekly round. She will earn 100*1000 = 100 000 tokens. {dashedTokens}"
          values={{br: <br/>,
            dashedTokens: <span
              title={this.props.intl.messages['leaderboard.ifHardcapWillReached']}
              style={{borderBottom: '1px dashed'}}>
              <FormattedMessage
                id="leaderboard.dashedTokens"
                defaultMessage="1000 tokens = $15"
              />
            </span>,
          }}
        />
      </div>
      <ReactTable
        columns={[
          {
            Header: <div
              className="table__header-wrapper">
              <FormattedMessage
                id="leaderboard.placeInRating"
                defaultMessage="Place In Rating"
              />
            </div>,
            minWidth: screenWidth === 'lg' ? 80 : 40,
            className: 'ratings__table-cell',
            accessor: 'place',
          },
          {
            Header: <div
              className="table__header-wrapper">
              <FormattedMessage
                id="leaderboard.pointCount"
                defaultMessage="Point Count"
              />
            </div>,
            accessor: 'point',
            minWidth: screenWidth === 'lg' ? 80 : 40,
            className: 'ratings__table-cell',
          }
        ]}
        data={infoTableData}
        scrollBarHeight={300}
      />
    </div>
  )

  renderGlobalBoard = (data, isGlobal, screenWidth, number) => {
    return (
      <ReactTable
        columns={isGlobal ? this.getGlobalColumns(screenWidth) : this.getRoundColumns(screenWidth)}
        data={data}
        scrollBarHeight={500}
        getTrProps={this.onRowClick}
        key={number}
      />
    );
  }
}

function formatDate(date) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  year = padDate(year);
  month = padDate(month);
  day = padDate(day);
  return day + '.' + month + '.' + year;
}
function padDate(number) {
  return number < 10 ? '0' + number : number;
};

const ProfitCell = ({profit, tx}) => {
  profit = (profit || 0).toFixed(2);
  if(tx) {
    return (
      <div className="profit">{profit}
      <a className="tx_link" target="_blank" href={'https://etherscan.io/tx/' + tx} // eslint-disable-line
        />
      </div>
    );
  } else {
    return (
      <div className="profit">{profit}</div>
    );
  }
};

export default injectIntl(connect(
  state => ({challenge: state.challenge, loggedIn: state.auth.loggedIn}),
  dispatch => ({
    showConfirmModal: (text, values, confirmHandler, body) => dispatch(showConfirmModal(text, values, confirmHandler, body)),
    updateChallenge: number => dispatch(updateChallenge(number)),
    takePart: () => dispatch(takePart()),
    getNextInfo: () => dispatch(getNextInfo()),
    applyForContract: (id) => dispatch(applyForContract(id)),
  }),
)(Leaderboard));

