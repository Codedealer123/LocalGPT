import { settings } from "./Databases.js";

settings.setItem("username", "Sign In")

export let getUsername = settings.getItem("username")

/**
 * @param {string} username 
 */

export async function changeUsername(username) {
  await settings.setItem("username", username)
}
