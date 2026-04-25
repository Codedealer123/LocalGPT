import IDBStorage from "../localDB.js";

export const mainDB = new IDBStorage("LocalGPT");
export const settings = new IDBStorage("settings")