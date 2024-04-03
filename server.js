const express = require("express");
const { getCosmWasmClient } = require("@sei-js/core");
require("dotenv").config();
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;

const cosmWasmClient = getCosmWasmClient("https://sei-rpc.brocha.in/");
let roundInfo = {};

app.use(cors());

const fetchRoundInfo = async () => {
  const response = await (
    await cosmWasmClient
  ).queryContractSmart(process.env.NEXT_PUBLIC_SWIPER_ADDRESS || "", {
    get_state: {},
  });
  return response;
};

const fetchUpdate = async () => {
  try {
    roundInfo = await fetchRoundInfo();
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
