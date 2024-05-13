import { ethers } from "ethers";
import express from "express";
import bodyParser from "body-parser";
import "dotenv/config";

import { abi } from "../artifacts/contracts/Parcel.sol/Parcel.json";
import { Parcel } from "../typechain-types";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const API_URL = process.env.API_URL;

if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !API_URL) {
  throw new Error("Missing environment variables");
}

const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

const app = express();

app.use(express.json());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get("/api/parcels", async (req, res) => {
  try {
    const parcels: Parcel.ParcelDataStruct[] =
      await contractInstance.getParcels();

    const serializedParcels = parcels.map((parcel) => ({
      id: parcel.id.toString(),
      price: parcel.price.toString(),
      state: parcel.state,
      city: parcel.city,
      clientFullName: parcel.clientFullName,
      clientPhoneNumber: parcel.clientPhoneNumber,
    }));
    res.status(200).json(serializedParcels);
  } catch (error) {
    if (error instanceof Error) {
      return res.json({ error: error.message });
    }
    res.json({ error: "An error occurred" });
  }
});

app.get("/api/parcels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parcel: Parcel.ParcelDataStruct = await contractInstance.getParcel(
      id
    );

    res.json({
      id: parcel.id.toString(),
      price: parcel.price.toString(),
      state: parcel.state,
      city: parcel.city,
      clientFullName: parcel.clientFullName,
      clientPhoneNumber: parcel.clientPhoneNumber,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.json({ error: error.message });
    }
    res.json({ error: "An error occurred" });
  }
});

app.post("/api/parcels", async (req, res) => {
  try {
    const { price, state, city, clientFullName, clientPhoneNumber } = req.body;

    const tx = await contractInstance.createParcel(
      price,
      state,
      city,
      clientFullName,
      clientPhoneNumber
    );

    await tx.wait();
    res.json({ message: "Parcel created" });
  } catch (error) {
    if (error instanceof Error) {
      return res.json({ error: error.message });
    }
    res.json({ error: "An error occurred" });
  }
});

app.get("/api/parcels/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const history: Parcel.ParcelHistoryItemStruct[] =
      await contractInstance.getParcelHistory(id);

    const serializedHistory = history.map((entry) => ({
      status: entry.status,
      timestamp: new Date(parseInt(entry.timestamp.toString()) * 1000),
    }));

    res.json(serializedHistory);
  } catch (error) {
    if (error instanceof Error) {
      return res.json({ error: error.message });
    }
    res.json({ error: "An error occurred" });
  }
});

app.listen(5000, () => {
  console.log("Server is running");
});
