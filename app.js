const Twitter = require('twit')
const keys = require('./keys')
const ccxt = require('ccxt')
const ftx = new ccxt['ftx']({ apiKey: keys.ftx_api, secret: keys.ftx_secret })

const client = new Twitter({
  consumer_key: keys.consumer_key,
  consumer_secret: keys.consumer_secret,
  access_token: keys.access_token_key,
  access_token_secret: keys.access_token_secret
});



(async () => {
  const RISK = 1
  const asset = 'ETH-PERP'
  let position = null  
  position = await getPosition(asset)
  console.log('current position ', position)
  
  const stream = client.stream('statuses/filter', { follow: '1171769235829415939' });

  stream.on('tweet', async function (event) {
    const side = getSide(event.text, asset)
    if(!position && side){
      position = await openPosition(asset, RISK, side)
    }else if(position && side && side !=position.side){
      position = await closePosition(asset, position.side, position.size)
    }
  });


})();
async function openPosition(asset, risk, side){
  const balance  = await getBalance()
  console.log('current USD balance', balance)
  const price = await getPrice(asset)
  console.log('current ', asset,' price ',price)
  const size = round(balance*risk/price, 3)
  console.log('trade size ',size)
  console.log('side ',side)
  if (price>0 && size > 0){
    const order = createOrder(asset, side, size, params={})
    if(order){
      console.log(order)
      return {side:side, size:size}
    }
  }
  return null
  
}

async function closePosition(asset, side, size){
  console.log('Closing position ', asset)
  side = side==='buy'?'sell':'buy'
  const order = createOrder(asset, side, size, params={reduceOnly:true})
  if(order){
    console.log(order)
    return null
  }
  return {side:side, size:size}

}

async function createOrder(asset, side, amount, params={}){
  console.log(' Placing market order' + asset + ' ' + side + ' amount '+amount+' on ftx' )
  try{
    const order = await ftx.createOrder(asset, 'market', side, amount, undefined, params)
    return order
  }catch(e){
    console.log(e)
    return null
  }
  
}
function getSide(text, asset){
  if(text.includes(asset)){
    if(text.toLowerCase().includes('buy')){
      return 'sell'
    }else if (text.toLowerCase().includes('sell')){
      return 'buy'
    }
    
  }
  return null
}
async function getBalance() {
  try {
    const b = await ftx.fetchBalance()
    return b.total.USD
  } catch (e) {
    console.log(e)
    return 0
  }
}

async function getPrice(asset) {
  try {
    const ticker = await ftx.fetchTicker(asset)
    return ticker.last
  }catch (e) {
    console.log(e)
    return 0
  }
}
async function getPosition(asset){
  const positions = (await ftx.privateGetPositions()).result
  for(let elem of positions){
    if(elem.future ===asset && elem.size >0){
      return {side:elem.side, size:elem.size}
    }
  }
  return null
}


function round(val, exp) {
  
      var div = Math.pow(10, exp);
      var rounded = Math.floor(val * div) / div;

      return rounded;
  

}