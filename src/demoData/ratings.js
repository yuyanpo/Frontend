import words from './words';
import names from './names';
export function generateRatings() {
  let traders = [];
  for(let i = 0; i < 25; i++) {
    traders.push(generateTraderRating(i + 1));
  }
  let investors = [];
  for(let i = 0; i < 25; i++) {
    investors.push(generateInvestorRating(i + 1));
  }
  return {traders, investors};
}

function generateTraderRating(rank) {
  const name = generateName();
  const totalContracts = Math.floor(Math.random() * 30);
  const successContracts = totalContracts - Math.floor(Math.random() * totalContracts);
  const dateCreated = (new Date(Date.now() - Math.floor(Math.random() * 365 + 20) * 86400000)).toString();
  const duration = Math.floor(Math.random() * 20 + 15);
  // const roi = Math.floor(Math.random() * 30 - 15);
  const rois = generateRoi();
  const minAmount = Math.floor(Math.random() * 7 + 4);
  const currency = 'BTC';
  const acceptInvestments = generateAcceptInvestments()
  const fee = Math.floor(Math.random() * 10 + 10);
  const moneyInManagement = Math.floor(Math.random() * 30 + 10) + ' BTC';
  const maxLoss = Math.floor(Math.random() * 10 + 10);
  return {name, totalContracts, successContracts,
    dateCreated, duration, minAmount, currency,
    fee, moneyInManagement, maxLoss,
    rois, name, rank, acceptInvestments};
}
function generateInvestorRating(rank) {
  const name = generateName();
  const totalContracts = Math.floor(Math.random() * 30);
  const rois = generateRoi();
  const successContracts = totalContracts - Math.floor(Math.random() * totalContracts);
  const dateCreated = (new Date(Date.now() - Math.floor(Math.random() * 365 + 20) * 86400000)).toString();
  const paidExcessProfit = Math.floor(Math.random() * 30) + 10 + ' BTC';
  const paidInvoices = Math.floor(Math.random() * 10) + 5;
  return {
    name, totalContracts, rois, successContracts, dateCreated, paidExcessProfit, paidInvoices, rank
  }
}

function generateRoi() {
  let rois = {}
  let period = ['1 week', '1 month', '3 months', '6 months', '12 months', 'All time']
  for(let i = 0; i < 6; i++) {
    rois[period[i]] = Math.floor(Math.random() * 30 - 15)
  }
  return rois;
}

function generateAcceptInvestments() {
  return Math.random() > .5 ? false : true
}

function generateName() {
  return words[Math.floor(Math.random() * words.length)] + 
    names[Math.floor(Math.random() * names.length)]; 
}
