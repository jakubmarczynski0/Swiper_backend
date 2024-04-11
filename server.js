const express = require("express");
const { getCosmWasmClient, getSigningCosmWasmClient } = require("@sei-js/core");
const { calculateFee, GasPrice } = require("@cosmjs/stargate");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
require("dotenv").config();
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;
const rpcEndpoint = "https://sei-rpc.brocha.in/";
const cosmWasmClient = getCosmWasmClient(rpcEndpoint);
let roundInfo = {};
let isnewRound = false;

app.use(cors());

const handleTransation = async () => {
  try {
    const gasPrice = GasPrice.fromString("0.1usei");
    const execute_fee = calculateFee(200000, gasPrice);
    const sender_wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      process.env.MNEMONIC,
      { prefix: "sei" }
    );
    const sender_client = await getSigningCosmWasmClient(
      rpcEndpoint,
      sender_wallet
    );

    let execute_msg = {
      decide_winner: {},
    };

    let tx = await sender_client.execute(
      process.env.NEXT_PUBLIC_ADMIN_ADDRESS,
      process.env.NEXT_PUBLIC_SWIPER_ADDRESS,
      execute_msg,
      execute_fee
    );
    console.log("tx", tx);
  } catch (e) {
    console.log("error", e);
  }
};

const fetchRoundInfo = async () => {
  try {
    const response = await (
      await cosmWasmClient
    ).queryContractSmart(process.env.NEXT_PUBLIC_SWIPER_ADDRESS || "", {
      get_state: {},
    });
    return response;
  } catch (e) {
    console.log("error", e);
  }
};

const fetchUpdate = async () => {
  try {
    roundInfo = await fetchRoundInfo();
    if (
      roundInfo?.config.round_time +
        roundInfo?.round_info?.round_start_time -
        roundInfo?.current_time <=
        0 &&
      isnewRound
    ) {
      handleTransation();
      isnewRound = false;
    } else {
      isnewRound = true;
    }
  } catch (e) {
    console.log(e);
  }

  setTimeout(() => {
    fetchUpdate();
  }, 800);
};

fetchUpdate();
// Middleware
app.use(express.json());

// Basic route for GET request
app.get("/fetch-round-info", (req, res) => {
  try {
    res.send(roundInfo);
  } catch (e) {
    console.log(e);
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
